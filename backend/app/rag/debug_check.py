from __future__ import annotations
import os, sys, traceback
from pathlib import Path
from .vector import VectorDB

def log(msg: str): print(msg, flush=True)

# .env 로드
log("[STEP 1] .env loading")
try:
    from dotenv import load_dotenv  # type: ignore
    ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
    if ENV_PATH.exists():
        load_dotenv(ENV_PATH); log(f"[INFO] loaded .env from {ENV_PATH}")
    else:
        load_dotenv(); log("[WARN] backend/.env not found; using process env only")
except Exception as e:
    log(f"[WARN] dotenv load failed: {e}")

# 요약
log(f"[STEP 2] CWD={os.getcwd()}")
log(f"[STEP 2] PYTHON_EXECUTABLE={sys.executable}")
log(f"[STEP 2] OPENAI_API_KEY set? {'YES' if os.getenv('OPENAI_API_KEY') else 'NO'}")
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")
log(f"[STEP 2] EMBED_MODEL={EMBED_MODEL}")

# VectorDB/경로 및 파일 목록
log("[STEP 3] Sample get() from 'corpus_emotion'")
try:
    vdb = VectorDB()
    pd = vdb.persist_dir  # type: ignore
    log(f"[STEP 3] Using persist_dir: {pd}")
    try:
        entries = list(pd.rglob("*"))
        log(f"[STEP 3] persist_dir contains {len(entries)} files/dirs")
        for p in entries[:8]:
            log(f"       - {p.relative_to(pd)}")
    except Exception as e:
        log(f"[WARN] listing persist_dir failed: {e}")
    rows = vdb.peek("corpus_emotion", k=3)
    if not rows:
        log("[RESULT] No rows returned — collection may be empty or uncommitted.")
    else:
        log("[RESULT] Sample docs:")
        for i, r in enumerate(rows, 1):
            text = (r.get("text") or "").replace("\n", " ")
            if len(text) > 120: text = text[:120] + "..."
            src = (r.get("meta") or {}).get("src")
            log(f"  {i}. src={src} text={text}")
except Exception as e:
    log(f"[ERR] Sample read failed: {e}")
    traceback.print_exc()

# (선택) 검색
if os.getenv("OPENAI_API_KEY"):
    log("[STEP 4] Embedding & query top-3 (optional)")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        q = "요즘 불안해서 잠이 잘 오지 않아요."
        emb = client.embeddings.create(model=EMBED_MODEL, input=[q]).data[0].embedding
        res = vdb.query("corpus_emotion", [emb], top_k=3)
        if not res:
            log("[RESULT] query returned no results.")
        else:
            log("[RESULT] query top-3:")
            for i, r in enumerate(res, 1):
                text = (r.get("text") or "").replace("\n", " ")
                if len(text) > 120: text = text[:120] + "..."
                src = (r.get("meta") or {}).get("src")
                score = r.get("score")
                log(f"  {i}. score={score:.4f} src={src} text={text}")
    except Exception as e:
        log(f"[ERR] Embedding/query failed: {e}")
        traceback.print_exc()

log("[DONE] debug_check finished.")
