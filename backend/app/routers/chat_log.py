# routers/chat_log.py
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
from app.crud import chat
from app.db.mongo import get_database

import os
import openai
import re

openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter(prefix="/chat-log", tags=["Chat Log"])


# -----------------------------
# 내부 헬퍼: 하루치 사용자 발화 텍스트 구성
# -----------------------------
def _build_daily_text(pairs: List[dict]) -> str:
    LINES = 40
    CHARS = 6000

    lines = []
    recent = pairs[-LINES:] if len(pairs) > LINES else pairs
    for p in recent:
        if p.get("sender") != "user":
            continue
        ts = (
            p["timestamp"].strftime("%H:%M")
            if isinstance(p.get("timestamp"), datetime)
            else ""
        )
        msg = (p.get("message") or "").replace("\r\n", "\n").replace("\r", "").strip()
        if msg:
            lines.append(f"[{ts}] 내담자: {msg}")

    joined = "\n".join(lines)
    return joined[-CHARS:] if joined else ""


# ✅ 최대 3줄까지만 자연스럽게 정리
def _force_three_lines(text: str, max_lines: int = 3) -> str:
    s = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()

    def clean(ln: str) -> str:
        ln = re.sub(r"^\s*(?:[-–—•*]|[0-9]+\.)\s*", "", ln)  # 불릿/번호 제거
        ln = re.sub(
            r"^(?:요약|하루\s*요약|주요\s*주제|감정\s*변화|위험\s*신호|분석)\s*[:：]\s*",
            "",
            ln,
            flags=re.I,
        )
        return ln.strip()

    lines = [clean(ln) for ln in s.split("\n") if ln.strip()]
    if lines:
        if len(lines) > max_lines:
            return "\n".join(lines[:max_lines])
        return "\n".join(lines)

    sentences = [clean(x) for x in re.split(r"(?<=[.!?。！？])\s+", s) if x.strip()]
    if sentences:
        return "\n".join(sentences[:max_lines])

    return ""


# -----------------------------
# 하루 감정 요약 생성
# -----------------------------
def _summarize_daily(text: str) -> str:
    if not text.strip():
        return "해당 날짜에 대화가 없습니다."

    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o",
            temperature=0.25,
            max_tokens=240,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "너는 하루 동안의 상담 대화 내용을 바탕으로, "
                        "사용자의 전반적인 감정 상태를 자연스럽게 요약하는 한국어 요약가야.\n"
                        "규칙:\n"
                        "- 대화 속에서 실제로 드러난 감정 표현, 분위기, 에너지의 흐름만 관찰해라.\n"
                        "- 사용자가 직접 언급하지 않은 내면의 문제나 진단(예: 정체성 혼란, 트라우마 등)은 추측하지 마라.\n"
                        "- 감정 표현이 거의 없거나 단순한 정보 대화일 경우에는 "
                        "억지로 감정을 만들어내지 말고, 차분하고 안정적인 하루로 자연스럽게 해석해라.\n"
                        "- 조언, 위로, 평가, 해석, 진단, 계획 문장은 포함하지 마라.\n"
                        "- 한국어로 2~3개의 짧은 문장으로 자연스럽게 작성하고, 문장 사이에는 줄바꿈을 사용해라.\n"
                        "- 불릿, 번호, 제목, 괄호, 따옴표, 이모지는 쓰지 마라."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "아래는 하루 동안 사용자가 챗봇과 나눈 대화 중 사용자 발화만 모은 것이다.\n"
                        "이 내용을 토대로 사용자의 하루 감정 상태를 2~3개의 짧은 문장으로 요약해라.\n"
                        "감정이 거의 드러나지 않는다면 전반적으로 평온하거나 안정된 하루로 묘사해라.\n\n"
                        f"{text}"
                    ),
                },
            ],
        )
        raw = resp["choices"][0]["message"]["content"].strip()
        return _force_three_lines(raw)
    except Exception as e:
        return f"요약 생성 중 오류가 발생했습니다: {e}"


# ---------------------------------
# 1) 일별 대화 날짜 목록 (최신순)
# ---------------------------------
@router.get("/dates", response_model=List[str])
async def get_chat_dates(
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    chats_list = await chat.get_user_chats(db, user_id)
    dates = sorted(
        {c["timestamp"].strftime("%Y-%m-%d") for c in chats_list},
        reverse=True,
    )
    return dates


# ---------------------------------------------------------
# 2) 특정 날짜의 전체 대화 (시간순 정렬)
# ---------------------------------------------------------
@router.get("/by-date/{date}")
async def get_chats_by_date(
    date: str,
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    chats_list = await chat.get_user_chats(db, user_id)
    results = []

    for c in chats_list:
        chat_date = c["timestamp"].strftime("%Y-%m-%d")
        if chat_date == date:
            results.append(
                {
                    "sender": "user",
                    "message": c.get("user_message"),
                    "timestamp": c["timestamp"],
                }
            )
            results.append(
                {
                    "sender": "bot",
                    "message": c.get("bot_reply"),
                    "timestamp": c["timestamp"],
                }
            )

    results.sort(key=lambda x: x["timestamp"])

    return {"date": date, "messages": results}


# ---------------------------------------
# 3) 특정 날짜 전체 대화 요약
# ---------------------------------------
@router.get("/summary-by-date")
async def summary_by_date(
    date: str = Query(..., description="YYYY-MM-DD"),
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    raw = await get_chats_by_date(date=date, user_id=user_id, db=db)
    pairs = raw["messages"]

    text = _build_daily_text(pairs)
    summary = _summarize_daily(text)

    return {
        "ok": True,
        "user_id": user_id,
        "date": date,
        "count_messages": len(pairs),
        "summary": summary,
    }


# ---------------------------------------
# 4) 오늘 하루 전체 대화 요약
# ---------------------------------------
@router.get("/summary-today")
async def summary_today(
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    today_str = datetime.now().strftime("%Y-%m-%d")

    chats_list = await chat.get_user_chats(db, user_id)
    pairs: List[dict] = []
    for c in chats_list:
        chat_date = c["timestamp"].strftime("%Y-%m-%d")
        if chat_date == today_str:
            pairs.append(
                {
                    "sender": "user",
                    "message": c.get("user_message"),
                    "timestamp": c["timestamp"],
                }
            )
            pairs.append(
                {
                    "sender": "bot",
                    "message": c.get("bot_reply"),
                    "timestamp": c["timestamp"],
                }
            )

    pairs.sort(key=lambda x: x["timestamp"])

    text = _build_daily_text(pairs)
    summary = _summarize_daily(text)

    return {
        "ok": True,
        "user_id": user_id,
        "date": today_str,
        "count_messages": len(pairs),
        "summary": summary,
    }


# ---------------------------------------
# 5) 모든 대화 초기화
# ---------------------------------------
@router.delete("/reset")
async def reset_chat_logs(
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await chat.delete_user_chats(db, user_id)
    return {"ok": True, "message": "All chat logs deleted"}
