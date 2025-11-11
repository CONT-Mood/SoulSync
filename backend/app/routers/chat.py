# backend/app/routers/chat.py
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
import asyncio  # ⭐ 병렬 실행을 위한 asyncio 추가
from typing import Literal, List, Dict, Optional
import re

router = APIRouter(prefix="/chat", tags=["Chat"])
openai.api_key = os.getenv("OPENAI_API_KEY")

# -----------------------------
# (추가) 파일 기반 전문 가이드 로더
# -----------------------------
from app.guides.loader import guidance_for  # guides/*.json 에서 구간별 텍스트 조회

# 필요한 경우에만 rag 수행
def should_use_rag(text: str) -> bool:
    """일반 잡담/감정 나눔 vs 자료/근거 질문 구분용 간단 휴리스틱"""
    t = (text or "").strip()
    if not t:
        return False

    # 아주 짧은 인사 / 자기소개는 RAG 불필요
    if looks_like_greeting(t):
        return False
    if len(t) < 25:
        return False

    # 자료/근거/논문 관련 키워드
    keywords = ["논문", "연구", "자료", "근거", "출처", "통계", "데이터", "문헌", "증거"]
    if any(k in t for k in keywords):
        return True

    # 구체적인 질문 느낌 (물음표, 왜/어떻게/무엇 등)
    question_words = ["?", "왜", "어떻게", "무엇", "뭐가", "알려줘"]
    if any(q in t for q in question_words):
        return True

    # 나머지는 기본적으로 RAG 안 씀
    return False


async def _get_latest_assessments(db, user_id: str) -> dict:
    """유저 최신 설문 점수와 baseline 조회"""
    doc = await db["users"].find_one(
        {"user_id": user_id},
        {"latest_assessments": 1, "baseline_scores": 1, "_id": 0}
    ) or {}
    return {
        "latest": (doc.get("latest_assessments") or {}),
        "baseline": (doc.get("baseline_scores") or {})
    }


def _compose_guide_prompt(latest: dict) -> str:
    """설문 점수 기반 전문 가이드 문단 (짧게)"""
    snippets = []
    for atype, label in (("phq9", "PHQ-9"), ("gad7", "GAD-7"), ("pss", "PSS"), ("mkpq16", "mKPQ-16")):
        if atype in latest:
            total = latest[atype].get("raw")
            g = guidance_for(atype, total)
            if g:
                band, text = g
                snippets.append(f"[{label} · {band}] {text}")
    if not snippets:
        return ""
    joined = "\n".join(f"- {s}" for s in snippets[:3])  # 과주입 방지: 최대 3개
    return (
        "\n\n[전문 가이드]\n"
        f"{joined}\n"
        "\n[상담 원칙]\n"
        "- 아래 가이드는 참고자료이며, 진단/치료 지시가 아님.\n"
        "- 불안/스트레스↑: 호흡·근이완·주의전환 등 단기전략 우선.\n"
        "- 우울/무기력↑: 작은 과제/행동활성화/리듬 정돈 등 부담 낮은 제안.\n"
        "- 공감적이고 간결하게(2–4문장) 답변."
    )

# -----------------------------
# RAG 관련 규칙 (기존 유지)
# -----------------------------
RAG_STRICT_RULES = (
    "\n\nCRITICAL RAG RULES:\n"
    "- STRICTLY use ONLY the provided Context below.\n"
    "- If an answer is not fully supported by the Context, reply exactly with '자료에 없음'.\n"
    "- Always add 'Sources:' with (source p.page) citations at the end."
)

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
        # 1) 감정 분석을 백그라운드 스레드에서 실행
        #    → 이 작업이 도는 동안 아래에서 과거 대화 조회 / RAG / 답변 생성까지 진행
        loop = asyncio.get_running_loop()
        emotion_task = loop.run_in_executor(
            None,                 # 기본 ThreadPoolExecutor 사용
            analyze_emotion,      # 동기 함수
            chat_input.message,   # 인자
        )

        # 2) 과거 대화 (조금 여유 있게 10개)
        chats_list = await get_user_chats(db, chat_input.user_id, limit=10)

        # 2-1) DB 형태를 build_messages에서 쓰는 형식으로 변환
        history_pairs: List[Dict] = []
        # get_user_chats는 최신순(desc) → 오래된 것부터 보이도록 역순
        for c in reversed(chats_list):
            ts = c.get("timestamp")
            history_pairs.append({
                "sender": "user",
                "message": c.get("user_message"),
                "timestamp": ts,
            })
            history_pairs.append({
                "sender": "bot",
                "message": c.get("bot_reply"),
                "timestamp": ts,
            })

        # 3) RAG 회수
        contexts: List[Dict] = []
        best_score = 999.0

        # ⭐ RAG 실제 사용 여부 결정
        use_rag = False
        if kb_mode == "strict":
            # strict 모드는 RAG 전용이라 그대로 유지
            use_rag = True
        elif kb_mode == "auto":
            use_rag = should_use_rag(chat_input.message)

        if use_rag:
            hits = query_similar(chat_input.message, top_k=top_k) or []
            if hits:
                best_score = float(hits[0].get("score", 999.0))

            if kb_mode == "strict":
                # strict: 컨텍스트를 무조건 사용 (없으면 '자료에 없음' 유도)
                contexts = hits
            else:
                # auto: 충분히 유사할 때만 컨텍스트 사용
                if hits and best_score <= kb_min_relevance:
                    contexts = hits

        # 4) RAG 컨텍스트 가공 (기존 로직 그대로)
        rag_contexts: List[Dict] = []
        for c in contexts:
            meta = c.get("metadata", {}) or {}
            rag_contexts.append(
                {
                    "text": c.get("text", ""),
                    "source": f"{meta.get('source', 'doc')} p.{meta.get('page', '?')}",
                }
            )


        # -----------------------------
        # (추가) 설문 점수 기반 전문 가이드 주입
        # -----------------------------
        info = await _get_latest_assessments(db, chat_input.user_id)
        guide_prompt = _compose_guide_prompt(info["latest"])

        # 원본 사용자 메시지와 모델에 넘길 메시지를 분리 (DB 저장/로그에는 원본 유지)
        orig_user_message = chat_input.message
        combined_user_message = (
            f"{orig_user_message}\n\n{guide_prompt}"
            if guide_prompt else orig_user_message
        )

        # 5) messages 생성 (사람처럼 2~3문장 + 캐릭터 말투 유지)
        messages = build_messages(
            character=chat_input.character,
            user_message=combined_user_message,  # ⬅️ 모델에는 가이드 주입된 메시지
            history_pairs=history_pairs,
            rag_contexts=rag_contexts if rag_contexts else None,
        )

        # 6) 캐릭터별 temperature (기존)
        decode = get_persona_decode(chat_input.character)
        temperature = decode.get("temperature", 0.4)
        if kb_mode == "strict":
            temperature = min(temperature, 0.25)

        # 7) 모델 호출 (기존)
        completion = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            temperature=temperature,
            top_p=1,
            max_tokens=320, # 응답 속도 개선 위해 토큰 수 제한
        )
        bot_reply = completion["choices"][0]["message"]["content"].strip()

        # ✅ 최종 안전망: 자기소개 제거
        bot_reply = strip_self_intro(bot_reply)

        # 7-1) 위에서 돌려놓은 감정 분석 결과 수신
        emotion_score = await emotion_task

        # 8) 저장 (원본 사용자 메시지를 저장!)
        chat_record = ChatDBModel(
            user_id=chat_input.user_id,
            character=chat_input.character,
            user_message=orig_user_message,  # ⬅️ 원본
            bot_reply=bot_reply,
            emotion_score=emotion_score,
        )
        await save_chat(db, chat_record)

        # 9) 응답 (기존 스키마 유지)
        return {
            "reply": bot_reply,
            "emotion_score": emotion_score if chat_input.show_emotion_score else None,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
