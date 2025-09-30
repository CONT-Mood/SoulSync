from __future__ import annotations
from typing import List, Dict, Any, Optional
from pathlib import Path
import os
import chromadb

class VectorDB:
    def __init__(self, persist_dir: Optional[str] = None):
        # 프로젝트 루트 기준 절대경로 고정
        root = Path(__file__).resolve().parents[2]
        target = persist_dir or os.getenv("CHROMA_DIR") or str(root / ".chroma")
        self.persist_dir = Path(target).expanduser().resolve()
        self.persist_dir.mkdir(parents=True, exist_ok=True)

        # ✅ 새 아키텍처 클라이언트 방식 (chroma==0.4.24에서도 사용 가능)
        #    Settings 없이 path만 주는 방식이 가장 호환성이 좋습니다.
        self.client = chromadb.PersistentClient(path=str(self.persist_dir))

        print(f"[VectorDB] persist_dir={self.persist_dir}", flush=True)

    def get(self, name: str):
        # cosine 거리 메타데이터는 새 아키텍처에서도 그대로 동작
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    def upsert_texts(
        self,
        collection: str,
        ids: List[str],
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        embeddings: List[List[float]],
    ):
        col = self.get(collection)
        col.upsert(ids=ids, documents=texts, metadatas=metadatas, embeddings=embeddings)

    def upsert_texts_batched(
        self,
        collection: str,
        ids: List[str],
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        embeddings: List[List[float]],
        batch_size: int = 2000,
    ):
        col = self.get(collection)
        n = len(ids)
        for i in range(0, n, batch_size):
            j = min(i + batch_size, n)
            col.upsert(
                ids=ids[i:j],
                documents=texts[i:j],
                metadatas=metadatas[i:j],
                embeddings=embeddings[i:j],
            )
            print(f"[INFO] upserted {j}/{n} to '{collection}'", flush=True)

    def query(
        self,
        collection: str,
        query_embeddings: List[List[float]],
        top_k: int = 4,
    ) -> List[Dict[str, Any]]:
        col = self.get(collection)
        res = col.query(
            query_embeddings=query_embeddings,
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )
        docs = (res.get("documents") or [[]])[0]
        metas = (res.get("metadatas") or [[]])[0]
        dists = (res.get("distances") or [[]])[0]
        out: List[Dict[str, Any]] = []
        for doc, meta, dist in zip(docs, metas, dists):
            sim = 1.0 - float(dist) if dist is not None else 0.0
            out.append({"text": doc, "meta": meta, "score": sim})
        return out

    def peek(self, collection: str, k: int = 3) -> List[Dict[str, Any]]:
        col = self.get(collection)
        got = col.get(limit=k, include=["documents", "metadatas"])
        docs = got.get("documents") or []
        metas = got.get("metadatas") or [{}] * len(docs)
        return [{"text": d, "meta": m} for d, m in zip(docs, metas)]
