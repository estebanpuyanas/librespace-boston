# data-service

One-time Python ETL: joins the 5 Analyze Boston datasets (spec.md section 4)
into a single spots index, then embeds a generated description per spot into
ChromaDB. Not a running service despite the directory name — it's a batch
job, not a live path, run before Saturday and re-run only if the join needs
fixing (spec.md section 7).

## Setup

```bash
uv sync
```

## Before running the ETL

Download the 5 datasets from data.boston.gov (spec.md section 4) into `raw/`,
named to match `config.py`. Open Space is downloaded as GeoJSON (it's
polygon geometry); the other four are CSV (point data). See
`raw/README.md` for the reasoning per dataset:

- `wicked_free_wifi.csv`
- `open_space.geojson`
- `park_features.csv`
- `accessible_park_details.csv`
- `public_trees.csv`

`raw/` and `output/` are gitignored — datasets and generated output aren't
committed (`raw/README.md` is the one tracked exception).

## Running

```bash
# 1. Join all 5 datasets -> output/spots.json
uv run etl.py

# 2. Embed descriptions + upsert into Chroma (needs `podman-compose up -d chroma` running)
uv run ingest.py
```

`etl.py`'s join functions are stubs (`NotImplementedError`) until the actual
CSVs are downloaded and their real column names/geometry formats are known —
see the TODOs inline. Verify the join against 10-15 known Boston
addresses/parks before trusting it, per spec.md section 15.
