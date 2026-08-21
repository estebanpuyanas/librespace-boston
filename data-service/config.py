import os
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw"
OUTPUT_DIR = Path(__file__).parent / "output"
SPOTS_PATH = OUTPUT_DIR / "spots.json"

CHROMA_URL = os.environ.get("CHROMA_URL", "http://localhost:8000")
CHROMA_COLLECTION = "spots"

# Analyze Boston source files, downloaded into raw/ before running the ETL
# see README.md and raw/README.md (format choice per dataset). WIFI_CSV = RAW_DIR / "wicked_free_wifi.csv"
OPEN_SPACE_GEOJSON = RAW_DIR / "open_space.geojson"
PARK_FEATURES_CSV = RAW_DIR / "park_features.csv"
ACCESSIBLE_PARKS_CSV = RAW_DIR / "accessible_park_details.csv"
TREES_CSV = RAW_DIR / "public_trees.csv"
