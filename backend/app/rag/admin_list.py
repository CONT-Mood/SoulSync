from __future__ import annotations
from pathlib import Path
import os
import chromadb
from chromadb.config import Settings

root = Path(__file__).resolve().parents[2]
chroma_dir = Path(os.getenv("CHROMA_DIR") or (root / ".chroma")).expanduser().resolve()
print("[LIST] CHROMA_DIR =", chroma_dir)

cli = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory=str(chroma_dir),
    anonymized_telemetry=False,
))

cols = cli.list_collections()
print("[LIST] collections:", [c.name for c in cols])

for c in cols:
    got = c.get(limit=3, include=["documents","metadatas"])
    docs = got.get("documents") or []
    print(f"  - {c.name}: sample {len(docs)} →", [ (d or "")[:30].replace("\n"," ") for d in docs ])
