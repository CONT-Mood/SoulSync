from fastapi import APIRouter, Depends, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse
from app.chatbot.analyze_emotion import analyze_emotion
from app.chatbot.character_response import (
    generate_character_prompt,  # 호환 유지 (다른 곳에서 써도 OK)
    build_messages,             # 새 메시지 빌더
    get_persona_decode,         # 캐릭터별 temperature
)
from app.crud.chat import save_chat, get_user_chats
from app.models.chat import ChatDBModel
from app.db.mongo import get_database

from app.rag.store import query_similar  # RAG 검색

import os
import openai
from typing import Literal, List, Dict, Optional
import re

router = APIRouter(prefix="/chat", tags=["Chat"])
openai.api_key = os.getenv("OPENAI_API_KEY")

# 엄격 모드에서만 쓰는 규칙 (유지: 필요 시 strict 활용)
RAG_STRICT_RULES = (
    "\n\nCRITICAL RAG RULES:\n"
    "- STRICTLY use ONLY the provided Context below.\n"
    "- If an answer is not fully supported by the Context, reply exactly with '자료에 없음'.\n"
    "- Always add 'Sources:' with (source p.page) citations at the end."
)

# auto 모드 가이드 (유지)
RAG_SOFT_HINT = (
    "\n\nRAG HINTS:\n"
    "- If the provided Context is relevant, prefer using it and add 'Sources:' with (source p.page).\n"
    "- If the Context is not relevant, ignore it and answer normally in your persona.\n"
    "- Do NOT say '자료에 없음' in this mode."
)

# 자기소개 패턴 (예: "저는 이석환입니다", "나는 홍길동이라고 합니다")
SELF_NAME_RE = re.compile(
    r"(저는|나는)\s*[\'\"]?([가-힣A-Za-z]+)[\'\"]?\s*(이라고 합니다|입니다)[.!]?",
    re.MULTILINE,
)

def strip_self_intro(text: str) -> str:
    """사람 이름 자기소개를 모두 상담봇으로 치환"""
    return SELF_NAME_RE.sub("저는 상담봇 SoulSync입니다.", text)

def looks_like_greeting(text: str) -> bool:
    """인사/자기소개로 보이는 짧은 메시지 감지"""
    t = (text or "").strip()
    return (len(t) <= 30) and any(x in t for x in ["안녕", "반가", "처음", "누구", "소개", "이름"])

@router.post("/", response_model=ChatResponse)
async def chat_with_bot(
    chat_input: ChatRequest,
    db=Depends(get_database),
    # 모드: off | auto | strict
    kb_mode: Literal["off", "auto", "strict"] = "auto",
    top_k: int = 5,
    # distance(작을수록 유사) 임계값
    kb_min_relevance: float = 0.25,
    model: str = "gpt-4o",
):
    """
    kb_mode:
      - off    : 기존 챗봇(캐릭터 100%) — RAG 사용 안 함
      - auto   : 문서와 충분히 관련 있을 때만 RAG 참고 (권장, 기본)
      - strict : 문서 기반 질문 전용. 컨텍스트 없으면 '자료에 없음'

    kb_min_relevance: 상위 문서 조각의 거리 기준 (작을수록 유사). 0.2~0.35 사이에서 튜닝 권장.
    """
    try:
        # 1) 감정 분석
        emotion_score = analyze_emotion(chat_input.message)

        # 2) 과거 대화 (조금 여유 있게 10개)
        past_chats = await get_user_chats(db, chat_input.user_id, limit=10)

        # 3) RAG 회수
        contexts = []
        best_score = 999.0
        force_no_rag = looks_like_greeting(chat_input.message)
        if kb_mode in ("auto", "strict") and not force_no_rag:
            hits = query_similar(chat_input.message, top_k=top_k) or []
            if hits:
                best_score = float(hits[0].get("score", 999.0))
            if kb_mode == "strict":
                contexts = hits
            else:  # auto
                if hits and best_score <= kb_min_relevance:
                    contexts = hits

        # 4) RAG 컨텍스트를 모델이 읽기 쉬운 형태로 가공
        rag_contexts: List[Dict] = []
        for c in contexts:
            meta = c.get("metadata", {}) or {}
            rag_contexts.append({
                "text": c.get("text", ""),
                "source": f"{meta.get('source', 'doc')} p.{meta.get('page', '?')}",
            })

        # 5) messages 생성 (사람처럼 2~3문장 + 캐릭터 말투 유지)
        messages = build_messages(
            character=chat_input.character,
            user_message=chat_input.message,
            history_pairs=past_chats,
            rag_contexts=rag_contexts if rag_contexts else None,
        )

        # 6) 캐릭터별 temperature 적용 (짧고 사람스러운 수렴)
        decode = get_persona_decode(chat_input.character)
        temperature = decode.get("temperature", 0.4)
        if kb_mode == "strict":
            temperature = min(temperature, 0.25)

        # 7) 모델 호출
        completion = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            temperature=temperature,
            top_p=1,
        )
        bot_reply = completion["choices"][0]["message"]["content"].strip()

        # ✅ 최종 안전망: 자기소개 제거
        bot_reply = strip_self_intro(bot_reply)

        # 8) 저장
        chat_record = ChatDBModel(
            user_id=chat_input.user_id,
            character=chat_input.character,
            user_message=chat_input.message,
            bot_reply=bot_reply,
            emotion_score=emotion_score,
        )
        await save_chat(db, chat_record)

        # 9) 응답 (기존 스키마 유지: reply + emotion_score)
        return {
            "reply": bot_reply,
            "emotion_score": emotion_score if chat_input.show_emotion_score else None,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
