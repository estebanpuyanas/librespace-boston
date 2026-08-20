"""
Embed a natural-language description per spot and upsert into ChromaDB.
Run after etl.py has produced output/spots.json. Also one-time/batch — see
spec.md section 7. Re-run is safe: upsert by spot_id is idempotent.

Vector search here is a semantic layer on top of the joined index, not a
replacement for the structured boolean filters (has_wifi, accessible, etc.)
— those are hard-filtered directly on the fields. Embeddings help match
free-text query phrasing against spot descriptions for fuzzy/soft attributes
that don't map cleanly to a field (see spec.md sections 8-9, 16).
"""

import json

import chromadb
from sentence_transformers import SentenceTransformer

import config

MODEL_NAME = "all-MiniLM-L6-v2"  # CPU-friendly, same as drillbit's backend


def describe(spot: dict) -> str:
    parts = [spot["name"]]
    if spot.get("has_wifi"):
        parts.append("has public Wi-Fi")
    if spot.get("is_park"):
        parts.append("is a park / open space")
    if spot.get("features"):
        parts.append("features: " + ", ".join(spot["features"]))
    if spot.get("accessible", {}).get("value"):
        parts.append("wheelchair accessible")
    if spot.get("tree_density_nearby"):
        parts.append(f"{spot['tree_density_nearby']} trees nearby")
    return ". ".join(parts)


def _flatten_metadata(spot: dict) -> dict:
    # Chroma metadata values must be scalar (str/int/float/bool) — the raw
    # spot dict has a nested `accessible` object, a `features` list, and a
    # `source_dataset` object, so those get JSON-encoded for storage here.
    # The full structured record still lives in output/spots.json.
    return {
        "spot_id": spot["spot_id"],
        "name": spot["name"],
        "lat": spot["lat"],
        "lon": spot["lon"],
        "has_wifi": spot["has_wifi"],
        "is_park": spot["is_park"],
        "features": json.dumps(spot["features"]),
        "accessible": json.dumps(spot["accessible"]),
        "tree_density_nearby": spot["tree_density_nearby"],
        "source_dataset": json.dumps(spot["source_dataset"]),
    }


def main() -> None:
    with config.SPOTS_PATH.open() as f:
        spots = json.load(f)

    model = SentenceTransformer(MODEL_NAME)
    client = chromadb.HttpClient(
        host=config.CHROMA_URL.split("://")[-1].split(":")[0],
        port=int(config.CHROMA_URL.rsplit(":", 1)[-1]),
    )
    collection = client.get_or_create_collection(config.CHROMA_COLLECTION)

    descriptions = [describe(s) for s in spots]
    embeddings = model.encode(descriptions).tolist()

    collection.upsert(
        ids=[s["spot_id"] for s in spots],
        embeddings=embeddings,
        documents=descriptions,
        metadatas=[_flatten_metadata(s) for s in spots],
    )
    print(f"Upserted {len(spots)} spots into Chroma collection '{config.CHROMA_COLLECTION}'")


if __name__ == "__main__":
    main()
