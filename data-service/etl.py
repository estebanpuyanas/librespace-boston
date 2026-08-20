"""
One-time ETL: join the 5 Analyze Boston datasets into a single spots index.
Run manually (`uv run etl.py`), not per-query — see spec.md section 7.

Open Space (park polygons) is the base set of spots. The other 4 datasets
join onto it:
  - Park_Features and the BPRD accessible-park-details table both carry an
    OS_ID / polygon_id column that matches Open Space's OS_ID directly (a
    reliable per-park join key, verified by spot-checking real park names).
  - Wicked Free Wi-Fi and public trees are city-wide point layers with no
    per-park id on most rows, so those join by spatial proximity instead
    (point-in-buffered-polygon).
"""

import json
import math
from dataclasses import asdict, dataclass, field

import geopandas as gpd
import pandas as pd

import config

# Massachusetts Mainland State Plane (meters) — used for buffering/proximity
# math; everything is converted back to WGS84 (lat/lon) for output.
METRIC_CRS = "EPSG:26986"
GEOGRAPHIC_CRS = "EPSG:4326"

# How far (in meters) a Wi-Fi node / tree can be from a park polygon and
# still count as "at"/"near" that park.
WIFI_PROXIMITY_M = 50
TREE_PROXIMITY_M = 100

# Park_Features `Asset` values -> the fixed Spot.features enum. Assets not
# listed here (Basketball, Tennis, Bike Rack, ...) aren't part of that enum
# and are dropped.
FEATURE_MAP = {
    "Athletic Seating": "seating",
    "Playground": "playground",
    "Restroom": "restroom",
    "Shade Stucture": "shade_structure",  # typo present in the source data
}

SOURCE_WIFI = "Wicked Free Wi-Fi Locations"
SOURCE_OPEN_SPACE = "Open Space"
SOURCE_PARK_FEATURES = "Park_Features"
SOURCE_ACCESSIBLE = "BPRD Accessible Park Details Augmented"
SOURCE_TREES = "BPRD Trees"


@dataclass
class Accessible:
    value: bool
    notes: str | None = None


@dataclass
class Spot:
    spot_id: str
    name: str
    lat: float
    lon: float
    has_wifi: bool = False
    is_park: bool = True
    features: list[str] = field(default_factory=list)
    accessible: Accessible = field(default_factory=lambda: Accessible(value=False))
    tree_density_nearby: int = 0
    # per-field dataset attribution, for citation in the synthesis step
    source_dataset: dict[str, str] = field(default_factory=dict)


def load_open_space() -> gpd.GeoDataFrame:
    gdf = gpd.read_file(config.OPEN_SPACE_GEOJSON)
    if gdf.crs is None:
        gdf = gdf.set_crs(GEOGRAPHIC_CRS)
    return gdf


def load_wifi() -> gpd.GeoDataFrame:
    df = pd.read_csv(config.WIFI_CSV)
    return gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df["device_long"], df["device_lat"]),
        crs=GEOGRAPHIC_CRS,
    )


def load_park_features() -> pd.DataFrame:
    df = pd.read_csv(config.PARK_FEATURES_CSV)
    df["OS_ID"] = df["OS_ID"].astype(str).str.strip()
    return df


def load_accessible_parks() -> pd.DataFrame:
    df = pd.read_csv(config.ACCESSIBLE_PARKS_CSV, dtype={"polygon_id": str})
    df["polygon_id"] = df["polygon_id"].astype(str).str.strip()
    return df


def load_trees() -> gpd.GeoDataFrame:
    df = pd.read_csv(config.TREES_CSV, dtype={"os_id": str}, low_memory=False)
    df = df.dropna(subset=["x_longitude", "y_latitude"])
    return gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df["x_longitude"], df["y_latitude"]),
        crs=GEOGRAPHIC_CRS,
    )


def _str_value(value: object) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return str(value).strip()


def _str_field(row: pd.Series, key: str) -> str:
    return _str_value(row.get(key))


def _park_name(row: pd.Series) -> str:
    return (
        _str_value(row["SITE_NAME"])
        or _str_value(row["ALT_NAME"])
        or f"Unnamed Open Space #{row['OBJECTID']}"
    )


def _park_features_for(os_id: str, features_df: pd.DataFrame) -> list[str]:
    rows = features_df[features_df["OS_ID"] == os_id]
    mapped = {FEATURE_MAP[a] for a in rows["Asset"] if a in FEATURE_MAP}
    return sorted(mapped)


def _accessible_for(os_id: str, accessible_df: pd.DataFrame) -> Accessible:
    matches = accessible_df[accessible_df["polygon_id"] == os_id]
    if matches.empty:
        return Accessible(value=False, notes=None)
    row = matches.iloc[0]

    stair_free = _str_field(row, "stair_free")
    stair_free_ok = stair_free not in ("", "No stair free access at this park")

    benches_wheelchair = _str_field(row, "benches_wheelchair") == "Y"
    table_wheelchair = _str_field(row, "table_wheelchair") == "Y"

    accessible_play = _str_field(row, "accessible_play")
    accessible_play_ok = accessible_play not in (
        "",
        "No playground at this park",
        "No accessible play elements",
    )

    value = stair_free_ok or benches_wheelchair or table_wheelchair or accessible_play_ok

    notes_parts = []
    if stair_free_ok:
        notes_parts.append(f"Stair-free access: {stair_free}")
    if benches_wheelchair:
        notes_parts.append("wheelchair-accessible benches")
    if table_wheelchair:
        notes_parts.append("wheelchair-accessible tables")
    if accessible_play_ok:
        notes_parts.append(f"accessible play: {accessible_play}")

    return Accessible(value=value, notes="; ".join(notes_parts) if notes_parts else None)


def join_datasets() -> list[Spot]:
    open_space = load_open_space()
    wifi = load_wifi()
    park_features = load_park_features()
    accessible_parks = load_accessible_parks()
    trees = load_trees()

    open_space = open_space.copy()
    open_space["OS_ID"] = open_space["OS_ID"].astype(str).str.strip()

    open_space_m = open_space.to_crs(METRIC_CRS)
    wifi_m = wifi.to_crs(METRIC_CRS)
    trees_m = trees.to_crs(METRIC_CRS)

    centroids_geo = open_space_m.geometry.centroid.to_crs(GEOGRAPHIC_CRS)

    wifi_buffer = gpd.GeoDataFrame(
        open_space_m[["OS_ID"]], geometry=open_space_m.geometry.buffer(WIFI_PROXIMITY_M)
    )
    wifi_hits = gpd.sjoin(wifi_m, wifi_buffer, predicate="within", how="inner")
    parks_with_wifi = set(wifi_hits["OS_ID"])

    tree_buffer = gpd.GeoDataFrame(
        open_space_m[["OS_ID"]], geometry=open_space_m.geometry.buffer(TREE_PROXIMITY_M)
    )
    tree_hits = gpd.sjoin(trees_m, tree_buffer, predicate="within", how="inner")
    tree_counts = tree_hits.groupby("OS_ID").size().to_dict()

    spots = []
    for idx, row in open_space.iterrows():
        os_id = row["OS_ID"]
        centroid = centroids_geo.loc[idx]
        spots.append(
            Spot(
                spot_id=f"os-{os_id}",
                name=_park_name(row),
                lat=centroid.y,
                lon=centroid.x,
                has_wifi=os_id in parks_with_wifi,
                is_park=True,
                features=_park_features_for(os_id, park_features),
                accessible=_accessible_for(os_id, accessible_parks),
                tree_density_nearby=int(tree_counts.get(os_id, 0)),
                source_dataset={
                    "name": SOURCE_OPEN_SPACE,
                    "is_park": SOURCE_OPEN_SPACE,
                    "has_wifi": SOURCE_WIFI,
                    "features": SOURCE_PARK_FEATURES,
                    "accessible": SOURCE_ACCESSIBLE,
                    "tree_density_nearby": SOURCE_TREES,
                },
            )
        )
    return spots


def _spot_to_dict(spot: Spot) -> dict:
    d = asdict(spot)
    return d


def main() -> None:
    spots = join_datasets()
    config.OUTPUT_DIR.mkdir(exist_ok=True)
    with config.SPOTS_PATH.open("w") as f:
        json.dump([_spot_to_dict(s) for s in spots], f, indent=2)
    print(f"Wrote {len(spots)} spots to {config.SPOTS_PATH}")


if __name__ == "__main__":
    main()
