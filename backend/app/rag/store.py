# backend/app/rag/store.py
import os
import re
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings

# =========================
# .env 로드 (backend/.env)
# =========================
from dotenv import load_dotenv
# BASE_DIR: .../backend
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
# backend/.env 명시적으로 로드
load_dotenv(os.path.join(BASE_DIR, ".env"))

# 🔷 OpenAI 구버전 SDK(0.28.x) 방식
import openai
openai.api_key = os.getenv("OPENAI_API_KEY")

# =========================
# 경로/클라이언트 설정
# =========================
DATA_DIR = os.path.join(BASE_DIR, "data")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma")
os.makedirs(CHROMA_DIR, exist_ok=True)

client = chromadb.PersistentClient(
    path=CHROMA_DIR,
    settings=Settings(allow_reset=False)
)

COLLECTION_NAME = "soulsync_kb"

def get_collection():
    return client.get_or_create_collection(name=COLLECTION_NAME)

# =========================
# 임베딩
# =========================
def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    OpenAI 임베딩 호출 (구 SDK).
    모델: text-embedding-3-small
    """
    if not texts:
        return []
    resp = openai.Embedding.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [d["embedding"] for d in resp["data"]]

# =========================
# 업서트 / 쿼리
# =========================
def upsert_documents(docs: List[Dict[str, Any]]) -> int:
    """
    docs: [{"id": str, "text": str, "metadata": {...}}, ...]
    """
    if not docs:
        return 0
    col = get_collection()
    ids = [d["id"] for d in docs]
    texts = [d["text"] for d in docs]
    metas = [d.get("metadata", {}) for d in docs]
    vectors = embed_texts(texts)

    col.upsert(
        ids=ids,
        embeddings=vectors,
        documents=texts,
        metadatas=metas
    )
    return len(ids)

def query_similar(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    쿼리 문장과 유사한 문서 조각을 상위 top_k개 조회.
    반환: [{id, text, metadata, score}, ...]  # score=거리(작을수록 유사)
    """
    col = get_collection()
    q_vecs = embed_texts([query])
    if not q_vecs:
        return []
    q_vec = q_vecs[0]

    # ✅ 최신 chroma에서는 include에서 ids가 보장되지 않을 수 있어 메타로 pseudo id 구성
    res = col.query(
        query_embeddings=[q_vec],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    hits: List[Dict[str, Any]] = []
    docs_list = res.get("documents", [])
    metas_list = res.get("metadatas", [])
    dists_list = res.get("distances", [])

    if docs_list and len(docs_list) > 0:
        n = len(docs_list[0])
        for i in range(n):
            meta = (metas_list[0][i] if metas_list and metas_list[0] else {}) or {}
            src = meta.get("source", "doc")
            page = meta.get("page", "?")
            chunk = meta.get("chunk", "?")
            pseudo_id = f"{src}__p{page}__c{chunk}"
            dist = float(dists_list[0][i]) if dists_list and dists_list[0] else 0.0

            hits.append({
                "id": pseudo_id,
                "text": docs_list[0][i],
                "metadata": meta,
                "score": dist
            })

    return hits

# =========================
# 📄 PDF 인덱싱 유틸
# =========================
from PyPDF2 import PdfReader

UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 청크 설정 (문자 기준) — 필요시 .env로 바꿔도 됨
CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "1200"))
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "200"))

_WS = re.compile(r"\s+")

def _normalize_text(t: str) -> str:
    return _WS.sub(" ", (t or "").strip())

def _chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    text = _normalize_text(text)
    if not text:
        return []
    out: List[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + chunk_size)
        out.append(text[start:end])
        if end >= n:
            break
        start = max(0, end - overlap)
    return out

def _read_pdf_pages(path: str) -> List[tuple]:
    """[(page_number, text), ...]"""
    pages = []
    with open(path, "rb") as f:
        reader = PdfReader(f)
        for i, page in enumerate(reader.pages, start=1):
            try:
                txt = page.extract_text() or ""
            except Exception:
                txt = ""
            pages.append((i, txt))
    return pages

def build_docs_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    """
    PDF 1개를 청크 단위 도큐먼트들로 변환:
    id: "{file}__p{page}__c{chunk_idx}"
    metadata: {"source": file, "page": int, "chunk": int}
    """
    docs: List[Dict[str, Any]] = []
    fname = os.path.basename(pdf_path)
    pages = _read_pdf_pages(pdf_path)
    for page_num, raw in pages:
        raw = _normalize_text(raw)
        if not raw:
            continue
        chunks = _chunk_text(raw, CHUNK_SIZE, CHUNK_OVERLAP)
        for ci, ch in enumerate(chunks):
            docs.append({
                "id": f"{fname}__p{page_num}__c{ci}",
                "text": ch,
                "metadata": {"source": fname, "page": page_num, "chunk": ci}
            })
    return docs

def scan_upload_pdfs() -> List[str]:
    """data/uploads 폴더의 PDF 목록"""
    if not os.path.isdir(UPLOAD_DIR):
        return []
    return sorted([
        os.path.join(UPLOAD_DIR, fn)
        for fn in os.listdir(UPLOAD_DIR)
        if fn.lower().endswith(".pdf")
    ])

def delete_docs_by_source(source_filename: str) -> int:
    """
    같은 파일을 다시 인덱싱할 때 중복 방지를 위해 기존 문서 삭제.
    """
    col = get_collection()
    try:
        col.delete(where={"source": source_filename})
        return 1
    except Exception:
        # chroma 버전/where 조건 지원 차이로 실패할 수도 있음 → 무시
        return 0

def rebuild_index(full_reset: bool = False) -> int:
    """
    uploads의 PDF들을 모두 인덱싱.
    - full_reset=True: 컬렉션 전체 삭제 후 재생성
    - full_reset=False: 파일 단위로 기존 문서만 삭제 후 업서트
    반환: 업서트된 총 문서(청크) 수
    """
    pdfs = scan_upload_pdfs()
    if not pdfs:
        return 0

    if full_reset:
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass
        _ = get_collection()  # recreate

    total = 0
    for pdf_path in pdfs:
        fname = os.path.basename(pdf_path)
        if not full_reset:
            delete_docs_by_source(fname)

        docs = build_docs_from_pdf(pdf_path)
        if not docs:
            continue
        total += upsert_documents(docs)
    return total

# =========================
# CLI 실행: 재인덱싱
# =========================
if __name__ == "__main__":
    n = rebuild_index(full_reset=False)
    print(f"[RAG] Indexed {n} chunks from: {UPLOAD_DIR}")
