# raw/ — dataset formats

Each of the 5 Analyze Boston datasets (spec.md section 4) is published in
several formats (CSV, GeoJSON, Shapefile, KML, ArcGIS REST, etc). We picked
per-dataset based on whether the ETL (`geopandas`/`shapely`, spec.md section
7) needs real polygon geometry or just a point:

| File                              | Format  | Why                                                                                                                     |
| ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `open_space.geojson`               | GeoJSON | Park/green-space boundaries are **polygons**, not points. `gpd.read_file()` parses GeoJSON geometry natively; a CSV export would need a baked-in WKT/geometry column to reconstruct the same shapes, and that's inconsistent across city exports. |
| `wicked_free_wifi.csv`             | CSV     | Point data — one Wi-Fi node per row (`device_lat`/`device_long` columns present). No polygon geometry to preserve, so plain CSV + `gpd.points_from_xy()` is simpler than parsing GeoJSON for a single coordinate pair. |
| `park_features.csv`                | CSV     | Point data — one in-park amenity per row (`POINT_X`/`POINT_Y` columns present). Same reasoning as Wi-Fi.               |
| `accessible_park_details.csv`      | CSV     | Per-park attribute table (accessibility flags/notes keyed by park/polygon id), not itself geometry — CSV is the natural fit; joins to `open_space.geojson` by park id/name during ETL. |
| `public_trees.csv`                 | CSV     | Point data — one tree per row (`x_longitude`/`y_latitude` columns present). Same reasoning as Wi-Fi.                   |

All 5 files, despite being labeled CSV in some cases, actually include a
`shape_wkt` and/or `POINT_X`/`POINT_Y` (or equivalent) column already — city
exports are fairly consistent about carrying coordinates even in "flat"
formats. GeoJSON was only worth the extra parsing step for Open Space, where
the geometry is a genuine multi-point polygon that a single lat/lon pair
can't represent.

Downloaded from data.boston.gov (spec.md section 4) on 2026-08-19. `raw/` is
gitignored (see root `.gitignore`) — only this README is tracked.
