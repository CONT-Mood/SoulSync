# file: backend/app/rag/ingest.py
from __future__ import annotations
from typing import List, Dict, Any, Iterable, Tuple, Set
from pathlib import Path
import os, json, re, hashlib
from traceback import print_exc

from .vector import VectorDB
from openai import OpenAI  # v1 client

# =============== ENV / OpenAI =================
try:
    from dotenv import load_dotenv  # type: ignore
    ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
    if ENV_PATH.exists(): load_dotenv(ENV_PATH)
    else: load_dotenv()
except Exception:
    pass

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

# 모델/배치
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")
EMBED_BATCH = int(os.getenv("EMBED_BATCH", "200"))
UPSERT_STREAM_SIZE = int(os.getenv("UPSERT_STREAM_SIZE", "2000"))
CHROMA_UPSERT_BATCH = int(os.getenv("CHROMA_UPSERT_BATCH", "2000"))
INGEST_LIMIT = int(os.getenv("INGEST_LIMIT", "0"))

# ✅ DRY 모드(네트워크 없이 난수 임베딩)
USE_DRY = os.getenv("DRY_EMBED", "0") == "1"
DRY_DIM  = int(os.getenv("DRY_EMBED_DIM", "1536"))

# 경로/컬렉션
DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"
COLLECTION = "corpus_emotion"

# 추출 힌트
TEXT_KEY_HINTS = {
    "utterance","utter","text","content","message","sentence",
    "dialog","dialogue","system_text","user_text","assistant_text",
    "qas","q","a"
}
SKIP_KEY_HINTS = {"id","idx","index","time","timestamp","date","label_id"}
HANGUL_RE = re.compile(r"[가-힣]")

def debug_data_dir() -> None:
    print(f"[DEBUG] DATA_DIR = {DATA_DIR}")
    if not DATA_DIR.exists():
        print("[DEBUG] DATA_DIR does not exist."); return
    for p in list(DATA_DIR.glob("*.json")) + list(DATA_DIR.glob("*.jsonl")):
        print(f"[DEBUG] found file: {p.name} ({p.stat().st_size} bytes)")

# =============== 추출 로직 ====================
def looks_like_utterance(s: str) -> bool:
    if not isinstance(s, str): return False
    s = s.strip()
    if len(s) < 2 or len(s) > 800: return False
    if HANGUL_RE.search(s): return True
    return len(s.split()) >= 3

def key_priority(k: str) -> int:
    kl = k.lower()
    if kl in TEXT_KEY_HINTS: return 0
    if kl in SKIP_KEY_HINTS: return 100
    for hint in TEXT_KEY_HINTS:
        if hint in kl: return 1
    return 10

def extract_texts(obj: Any, base_meta: Dict[str, Any]) -> List[Tuple[str, Dict[str,Any]]]:
    out: List[Tuple[str, Dict[str,Any]]] = []
    if isinstance(obj, str):
        if looks_like_utterance(obj):
            out.append((obj.strip(), dict(base_meta)))
        return out
    if isinstance(obj, list):
        for i, v in enumerate(obj):
            meta = dict(base_meta); meta.setdefault("idx", i)
            out.extend(extract_texts(v, meta))
        return out
    if isinstance(obj, dict):
        lab = None
        for lk in ("label","emotion","sentiment","category"):
            if lk in obj and isinstance(obj[lk], str):
                lab = obj[lk]; break
        keys_sorted = sorted(obj.keys(), key=lambda k: key_priority(k))
        for k in keys_sorted:
            v = obj[k]; kl = k.lower()
            if kl in SKIP_KEY_HINTS: continue
            meta = dict(base_meta); meta.setdefault("key", kl)
            if lab is not None: meta["label"] = lab
            if isinstance(v, str):
                if key_priority(kl) <= 10 and looks_like_utterance(v):
                    out.append((v.strip(), meta))
                continue
            out.extend(extract_texts(v, meta))
        return out
    return out

# =============== 로딩 ========================
def _iter_jsonl(fp: Path) -> Iterable[Any]:
    with fp.open("r", encoding="utf-8") as f:
        for ln, line in enumerate(f, 1):
            line = line.strip()
            if not line: continue
            try: yield json.loads(line)
            except Exception as e: print(f"[WARN] JSONL parse error at {fp.name}:{ln}: {e}")

def _load_file(fp: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    try:
        iterable = list(_iter_jsonl(fp)) if fp.suffix.lower()==".jsonl" else json.loads(fp.read_text(encoding="utf-8"))
        if not isinstance(iterable, list): iterable = [iterable]
        cnt_raw = len(iterable); extracted = 0
        for idx, item in enumerate(iterable):
            base_meta = {"src": fp.name, "idx": idx}
            pairs = extract_texts(item, base_meta)
            for text, meta in pairs:
                rows.append({"text": text, "meta": meta})
            extracted += len(pairs)
        print(f"[INFO] parsed {fp.name}: raw_items={cnt_raw}, extracted={extracted}")
    except Exception as e:
        print(f"[WARN] skip {fp.name}: {e}")
    return rows

def _load_corpus() -> List[Dict[str, Any]]:
    print(f"[INFO] scanning data dir: {DATA_DIR}")
    if not DATA_DIR.exists():
        print("[WARN] data dir not found."); return []
    files = list(DATA_DIR.glob("*.json")) + list(DATA_DIR.glob("*.jsonl"))
    if not files:
        print("[WARN] no json/jsonl files found in data/raw"); return []
    all_rows: List[Dict[str, Any]] = []
    for fp in files:
        all_rows.extend(_load_file(fp))
    seen: Set[str] = set(); uniq_rows: List[Dict[str, Any]] = []
    for r in all_rows:
        t = r["text"]
        if t in seen: continue
        seen.add(t); uniq_rows.append(r)
    print(f"[INFO] total extracted rows (dedup): {len(uniq_rows)}")
    if INGEST_LIMIT > 0:
        print(f"[INFO] INGEST_LIMIT={INGEST_LIMIT} → first {INGEST_LIMIT} rows will be processed")
        uniq_rows = uniq_rows[:INGEST_LIMIT]
    return uniq_rows

# =============== 임베딩 ======================
def _embed_chunk(texts: List[str]) -> List[List[float]]:
    if USE_DRY:
        import random
        embs = [[random.random() for _ in range(DRY_DIM)] for _ in texts]
        print(f"[INFO]   (DRY) generated {len(embs)} random embeddings (dim={DRY_DIM})")
        return embs
    if client is None:
        raise RuntimeError("OPENAI_API_KEY is not set and DRY_EMBED is not enabled.")
    embs: List[List[float]] = []
    for i in range(0, len(texts), EMBED_BATCH):
        part = texts[i:i+EMBED_BATCH]
        resp = client.embeddings.create(model=EMBED_MODEL, input=part)
        embs.extend([d.embedding for d in resp.data])
        print(f"[INFO]   embedded sub-batch {i+len(part)}/{len(texts)}")
    return embs

# =============== ID ==========================
def _make_id(src: str, text: str) -> str:
    h = hashlib.blake2b(text.encode("utf-8"), digest_size=8).hexdigest()
    return f"{src}-{h}"

# =============== MAIN ========================
def ingest_corpus_emotion() -> int:
    rows = _load_corpus()
    if not rows:
        print("[INFO] no rows to ingest"); return 0

    total = len(rows)
    vdb = VectorDB()
    done = 0

    for s in range(0, total, UPSERT_STREAM_SIZE):
        e = min(s + UPSERT_STREAM_SIZE, total)
        sub = rows[s:e]
        texts = [r["text"] for r in sub]
        metas = [r["meta"] for r in sub]
        ids = [_make_id(m.get("src","?"), texts[i]) for i, m in enumerate(metas)]

        print(f"[INFO] embedding rows {s+1}..{e}/{total}")
        embs = _embed_chunk(texts)

        print(f"[INFO] upserting rows {s+1}..{e}/{total} (batch size={CHROMA_UPSERT_BATCH})", flush=True)
        try:
            vdb.upsert_texts_batched(
                COLLECTION,
                ids=ids, texts=texts, metadatas=metas, embeddings=embs,
                batch_size=CHROMA_UPSERT_BATCH,
            )
            sample = vdb.peek(COLLECTION, k=1)
            if sample:
                stext = sample[0].get("text") if isinstance(sample[0], dict) else str(sample[0])
                stext = (stext or "").replace("\n", " ")
                print(f"[INFO] peek after commit: {stext[:60]}...", flush=True)
            else:
                print("[WARN] peek after commit returned 0 doc.", flush=True)
        except Exception as ex:
            print("[ERR] upsert_texts_batched raised an exception:", ex, flush=True)
            print_exc()
            raise

        done = e
        print(f"[INFO] committed {done}/{total} to '{COLLECTION}'", flush=True)

    print(f"[INFO] upsert finished: {done} items")
    return done

if __name__ == "__main__":
    debug_data_dir()
    ingest_corpus_emotion()
