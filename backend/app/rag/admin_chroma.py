from __future__ import annotations
from pathlib import Path
import os
import chromadb
from chromadb.config import Settings

root = Path(__file__).resolve().parents[2]
chroma_dir = Path(os.getenv("CHROMA_DIR") or (root / ".chroma")).expanduser().resolve()
print("[ADMIN] CHROMA_DIR =", chroma_dir)

client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory=str(chroma_dir),
    anonymized_telemetry=False,
))

cols = client.list_collections()
print("[ADMIN] collections:", [c.name for c in cols])

for name in ("corpus_emotion", "tmp_test", "tmp_test_dry16", "quick_test"):
    try:
        client.delete_collection(name)
        print(f"[ADMIN] deleted collection: {name}")
    except Exception as e:
        print(f"[ADMIN] skip delete {name}: {e}")

print("[ADMIN] done.")
