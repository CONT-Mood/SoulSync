from __future__ import annotations
from pathlib import Path
import os, random
from .vector import VectorDB

# .env 로드(선택)
try:
    from dotenv import load_dotenv
    ENV = Path(__file__).resolve().parents[2] / ".env"
    if ENV.exists(): load_dotenv(ENV)
except: pass

DIM = int(os.getenv("SANITY_DIM", "16"))  # 작은 차원으로 충분

def _rand_vec(d=DIM): return [random.random() for _ in range(d)]

def main():
    vdb = VectorDB()
    print("[SANITY] using dir:", vdb.persist_dir, flush=True)

    texts = ["안녕하세요.", "요즘 불안해서 잠이 잘 안 와요.", "오늘 기분이 꽤 좋아요!"]
    embs  = [_rand_vec() for _ in texts]
    ids   = [f"t{i}" for i in range(len(texts))]
    metas = [{"src":"sanity"} for _ in texts]

    vdb.upsert_texts_batched("tmp_test_dry16", ids, texts, metas, embs, batch_size=10)
    res = vdb.query("tmp_test_dry16", [qemb], top_k=3)
    print("[SANITY] upserted 3 docs to tmp_test", flush=True)

    # 같은 차원으로 쿼리
    qemb = _rand_vec()
    res = vdb.query("tmp_test", [qemb], top_k=3)
    print("[SANITY] query results:")
    for r in res:
        print("  -", r["text"], "| score:", round(r["score"], 4))

if __name__ == "__main__":
    main()
