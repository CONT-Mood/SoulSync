# backend/app/rag/router.py
import os
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

# 🔷 OpenAI 구버전 SDK(0.28.x) 방식
import openai
openai.api_key = os.getenv("OPENAI_API_KEY")

from .ingest import ingest_pdf
from .store import query_similar

router = APIRouter(prefix="/rag", tags=["RAG"])

# ---- 업로드 저장 폴더: backend/data/uploads ----
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---- RAG 시스템 프롬프트(안전/공감 톤) ----
RAG_SYSTEM = (
    "You are a helpful, trauma-aware counseling assistant. "
    "Use ONLY the provided context to answer. If information is missing, say so and suggest next steps. "
    "Be empathetic and concise. Always include 'Sources:' with (source p.page) citations."
)

def _build_prompt(query: str, contexts: List[dict]) -> str:
    """
    검색된 컨텍스트(문서 조각들)를 프롬프트로 합치기.
    """
    ctx_lines = []
    for c in contexts:
        meta = c.get("metadata", {}) or {}
        src = meta.get("source", "doc")
        page = meta.get("page", "?")
        text = c.get("text", "")
        ctx_lines.append(f"[{src} p.{page}] {text}")
    ctx_text = "\n\n".join(ctx_lines) if ctx_lines else "(no context found)"

    return (
        f"Context:\n{ctx_text}\n\n"
        f"User question: {query}\n\n"
        f"Instructions:\n"
        f"- Ground the answer strictly in the Context.\n"
        f"- If unsure or not present in context, say what is missing and avoid fabricating.\n"
        f"- Add 'Sources:' at the end listing sources like (source p.page)."
    )

# ==========================
# 1) PDF 업로드 & 인덱싱
# ==========================
@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), source: Optional[str] = Form(None)):
    """
    PDF 파일 업로드 → 벡터DB 인덱싱
    """
    filename = file.filename or "uploaded.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다.")

    source_name = source or os.path.splitext(filename)[0]
    save_path = os.path.join(UPLOAD_DIR, filename)

    # 파일 저장
    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    # 인덱싱
    try:
        chunks_indexed = ingest_pdf(save_path, source_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"인덱싱 중 오류: {e}")

    return {
        "ok": True,
        "filename": filename,
        "source": source_name,
        "chunks_indexed": chunks_indexed
    }

# ==========================
# 2) 유사 검색 미리보기
# ==========================
@router.get("/search")
def search(query: str, top_k: int = 5):
    hits = query_similar(query, top_k=top_k)
    return {"ok": True, "results": hits}

# ==========================
# 3) 검색 + GPT 생성(출처 포함)
# ==========================
@router.post("/chat")
def rag_chat(query: str, top_k: int = 5, model: str = "gpt-3.5-turbo"):
    contexts = query_similar(query, top_k=top_k)
    prompt = _build_prompt(query, contexts)

    try:
        resp = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": RAG_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        answer = resp["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI 호출 오류: {e}")

    return {
        "ok": True,
        "answer": answer,
        "contexts": contexts
    }
