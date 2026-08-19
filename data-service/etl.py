"""
One-time ETL: join the 5 Analyze Boston datasets into a single spots index.
Run manually (`uv run etl.py`), not per-query — see spec.md section 7.

This is a skeleton: the join logic depends on the actual column names and
geometry formats in each downloaded CSV, which aren't known until the real
datasets are in raw/. Fill in each _load_* function once the files are
downloaded (see README.md), then verify the spatial join against 10-15 known
Boston addresses/parks before trusting it (spec.md section 15).
"""

import json
from dataclasses import asdict, dataclass, field

import geopandas as gpd

import config


@dataclass
class Spot:
    spot_id: str
    name: str
    lat: float
    lon: float
    has_wifi: bool = False
    is_park: bool = False
    features: list[str] = field(default_factory=list)
    accessible: bool = False
    accessible_notes: str | None = None
    tree_density_nearby: int = 0
    # per-field dataset attribution, for citation in the synthesis step
    source_dataset: dict[str, str] = field(default_factory=dict)


def load_open_space() -> gpd.GeoDataFrame:
    # TODO: gpd.read_file(config.OPEN_SPACE_CSV) or read_csv + points_from_xy,
    # depending on whether the export is polygons or lat/lon columns.
    raise NotImplementedError


def load_wifi() -> gpd.GeoDataFrame:
    # TODO
    raise NotImplementedError


def load_park_features() -> gpd.GeoDataFrame:
    # TODO
    raise NotImplementedError


def load_accessible_parks() -> gpd.GeoDataFrame:
    # TODO
    raise NotImplementedError


def load_trees() -> gpd.GeoDataFrame:
    # TODO
    raise NotImplementedError


def join_datasets() -> list[Spot]:
    # TODO: nearest-neighbor / within-radius joins on lat/lon (spec.md section 7).
    # Start from open_space as the base set of candidate spots, then join
    # wifi/features/accessibility/trees onto it by proximity.
    raise NotImplementedError


def main() -> None:
    spots = join_datasets()
    config.OUTPUT_DIR.mkdir(exist_ok=True)
    with config.SPOTS_PATH.open("w") as f:
        json.dump([asdict(s) for s in spots], f, indent=2)
    print(f"Wrote {len(spots)} spots to {config.SPOTS_PATH}")


if __name__ == "__main__":
    main()
