# backend/app/rag/utils.py
import re
from typing import List, Dict
from pypdf import PdfReader

def read_pdf_text(file_path: str) -> List[Dict]:
    """
    PDF에서 페이지별 텍스트 추출.
    반환: [{"page": 1, "text": "..."} , ...]
    """
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        # 공백/개행 정리
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
        pages.append({"page": i + 1, "text": text})
    return pages

def simple_chunk(text: str, max_chars: int = 1200, overlap: int = 150) -> List[str]:
    """
    아주 단순한 문자 기준 청크 분할. (처음엔 이걸로 충분)
    나중에 tiktoken으로 교체해도 됨.
    """
    text = (text or "").strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    chunks: List[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + max_chars)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        # 다음 청크는 overlap만큼 겹치게
        start = max(0, end - overlap)
        if start >= n:
            break
    return chunks
