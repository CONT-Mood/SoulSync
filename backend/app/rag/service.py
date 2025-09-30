from __future__ import annotations
from typing import Dict, Any, List
from .vector import VectorDB
from app.openai_client import client, CHAT_MODEL, EMBED_MODEL

COLLECTION = "corpus_emotion"

def _embed_query(text: str) -> List[float]:
    # v1: client.embeddings.create(...)
    return client.embeddings.create(model=EMBED_MODEL, input=[text]).data[0].embedding

def _build_system_prompt(character: str, context: str) -> str:
    style = {
        "empathic": "따뜻하고 공감적인 말투로, 판단하지 말고 사용자 감정을 요약해줘.",
        "coach":    "코칭 스타일로 사용자가 스스로 해결책을 떠올릴 수 있게 질문 위주로 도와줘.",
        "realist":  "현실적이고 명료하게, 불필요한 수사는 줄이고 핵심만 조언해줘.",
        "friend":   "친근하고 편안한 말투로, 위로와 공감 중심으로 답해줘.",
    }.get(character, "따뜻하고 공감적인 말투로 답해줘.")

    ctx = f"\n\n[참고맥락]\n{context}\n" if context else ""
    return (
        "당신은 정신건강 대화 도우미입니다. 한국어로 답하세요."
        f"{ctx}\n\n[스타일 지시]\n{style}\n"
        "대답은 4~6문장으로 간결하게."
    )

def rag_chat(user_id: str, character: str, message: str) -> Dict[str, Any]:
    # 1) 쿼리 임베딩 → 벡터 검색
    q_emb = _embed_query(message)
    vdb = VectorDB()
    hits = vdb.query(COLLECTION, [q_emb], top_k=4)
    context = "\n\n".join([h["text"] for h in hits]) if hits else ""

    # 2) 시스템 프롬프트 + 대화
    sys_prompt = _build_system_prompt(character, context)
    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": message},
    ]

    # 3) 모델 호출 (v1)
    res = client.chat.completions.create(model=CHAT_MODEL, messages=messages, temperature=0.7)
    reply = res.choices[0].message.content.strip()

    return {"reply": reply, "retrieval": hits}
