import os
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw"
OUTPUT_DIR = Path(__file__).parent / "output"
SPOTS_PATH = OUTPUT_DIR / "spots.json"

CHROMA_URL = os.environ.get("CHROMA_URL", "http://localhost:8000")
CHROMA_COLLECTION = "spots"

# Analyze Boston source CSVs, downloaded manually into raw/ before running the
# ETL — see README.md. Filenames are ours; datasets are published under
# whatever names data.boston.gov assigns.
WIFI_CSV = RAW_DIR / "wicked_free_wifi.csv"
OPEN_SPACE_CSV = RAW_DIR / "open_space.csv"
PARK_FEATURES_CSV = RAW_DIR / "park_features.csv"
ACCESSIBLE_PARKS_CSV = RAW_DIR / "accessible_park_details.csv"
TREES_CSV = RAW_DIR / "public_trees.csv"
