# data-service

One-time Python ETL: joins the 5 Analyze Boston datasets (spec.md section 4)
into a single spots index, then embeds a generated description per spot into
ChromaDB. Not a running service despite the directory name it's a batch
job, not a live path, run before Saturday and re-run only if the join needs
fixing (spec.md section 7).

## Setup

```bash
uv sync
```

## Datasets

The 5 Analyze Boston datasets (spec.md section 4) are committed under
`raw/`, named to match `config.py`. Open Space is GeoJSON (polygon
geometry); the other four are CSV (point data). See `raw/README.md` for the
reasoning per dataset:

- `wicked_free_wifi.csv`
- `open_space.geojson`
- `park_features.csv`
- `accessible_park_details.csv`
- `public_trees.csv`

`output/` (the ETL's generated index) is gitignored only `raw/` is
committed.

## Running

```bash
# 1. Join all 5 datasets -> output/spots.json
uv run etl.py

# 2. Embed descriptions + upsert into Chroma (needs `podman-compose up -d chroma` running)
uv run ingest.py
```

`etl.py` uses Open Space's polygons as the base set of spots: Park_Features
and BPRD Accessible Park Details join onto it by `OS_ID`/`polygon_id`;
Wi-Fi and public trees, which lack a reliable per-park id, join by spatial
proximity (point-in-buffered-polygon) instead see the module docstring in
`etl.py`. If you change the join, re-verify it against 10-15 known Boston
addresses/parks before trusting it, per spec.md section 15.
