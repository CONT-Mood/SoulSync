from __future__ import annotations
from typing import List, Dict, Any
import os, openai
from .vector import VectorDB
from app.openai_client import client, EMBED_MODEL

openai.api_key = os.getenv("OPENAI_API_KEY")
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-ada-002")

def _embed_query(text: str) -> List[float]:
    resp = client.embeddings.create(model=EMBED_MODEL, input=[text])
    return resp["data"][0]["embedding"]

def retrieve_context(user_id: str, query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
    vdb = VectorDB()
    q = _embed_query(query_text)
    # MVP: 감정 코퍼스만 사용. 이후 user_chat/user_profile 합류.
    return vdb.query("corpus_emotion", [q], top_k=top_k)
