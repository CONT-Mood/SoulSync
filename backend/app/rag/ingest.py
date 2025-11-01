# backend/app/rag/ingest.py
import os
import uuid
from typing import List, Dict

from .utils import read_pdf_text, simple_chunk
from .store import upsert_documents

def ingest_pdf(file_path: str, source_name: str) -> int:
    """
    PDF 파일을 읽어 페이지/청크 단위로 벡터DB에 업서트.
    metadata: {source, page, chunk}
    """
    pages = read_pdf_text(file_path)
    docs: List[Dict] = []
    for p in pages:
        page_no = p["page"]
        text = p["text"]
        if not text:
            continue
        chunks = simple_chunk(text, max_chars=1200, overlap=150)
        for idx, ch in enumerate(chunks):
            doc_id = f"{source_name}__p{page_no}__c{idx}__{uuid.uuid4().hex[:8]}"
            docs.append({
                "id": doc_id,
                "text": ch,
                "metadata": {
                    "source": source_name,
                    "page": page_no,
                    "chunk": idx
                }
            })
    count = upsert_documents(docs)
    return count
