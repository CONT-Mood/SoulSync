# routers/chat_log.py
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
from app.crud import chat
from app.db.mongo import get_database

# OpenAI
import os, openai, re
openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter(prefix="/chat-log", tags=["Chat Log"])


# -----------------------------
# 내부 헬퍼: 감정요약 컨텍스트 구성
#  - 사용자 발화만 사용
#  - 과도한 길이 방지(최근 N줄/최대 글자)
# -----------------------------
def _build_daily_text(pairs: List[dict]) -> str:
    LINES = 40
    CHARS = 6000

    lines = []
    recent = pairs[-LINES:] if len(pairs) > LINES else pairs
    for p in recent:
        if p.get("sender") != "user":
            continue
        ts = p["timestamp"].strftime("%H:%M") if isinstance(p.get("timestamp"), datetime) else ""
        msg = (p.get("message") or "").replace("\r\n", "\n").replace("\r", "").strip()
        if msg:
            lines.append(f"[{ts}] 내담자: {msg}")

    joined = "\n".join(lines)
    return joined[-CHARS:] if joined else ""


# ✅ 모델이 규칙을 어겨도 '정확히 3줄'만 남기는 후처리
def _force_three_lines(text: str) -> str:
    s = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()

    def clean(ln: str) -> str:
        # 줄 앞의 불릿/번호/라벨 제거
        ln = re.sub(r"^\s*(?:[-–—•*]|[0-9]+\.)\s*", "", ln)  # 불릿/번호
        ln = re.sub(
            r"^(?:요약|하루\s*요약|주요\s*주제(?:\s*키워드)?|감정\s*변화(?:/\s*패턴)?|위험\s*신호|권장\s*조치|분석)\s*[:：]\s*",
            "",
            ln,
            flags=re.I,
        )
        return ln.strip()

    lines = [clean(ln) for ln in s.split("\n") if ln.strip()]
    if len(lines) >= 3:
        return "\n".join(lines[:3])

    # 줄이 모자라면 문장 단위로 보정
    joined = " ".join(lines) if lines else s
    sentences = [clean(x) for x in re.split(r"(?<=[.!?。！？])\s+", joined) if x.strip()]
    if len(sentences) >= 3:
        return "\n".join(sentences[:3])

    return "\n".join((sentences or lines)[:3])


def _summarize_daily(text: str) -> str:
    if not text.strip():
        return "해당 날짜에 대화가 없습니다."
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o",
            temperature=0.2,        # 사건요약으로 새는 걸 줄이기 위해 보수적으로
            max_tokens=240,         # 장문 억제
            messages=[
                {
                    "role": "system",
                    "content": (
                        "역할: 상담 대화 감정 요약가\n"
                        "출력 형식: 줄바꿈 기준 정확히 3줄, 각 줄 1문장, 불릿/번호/제목/라벨/콜론/이모지 금지\n"
                        "내용 규칙:\n"
                        "- 사건/사실/조언/해결책 요약 금지, 감정(정서 톤/변화/촉발/욕구·자원)만 기술\n"
                        "- 병명·진단 단정 금지, 도덕적 판단·명령형 표현 금지\n"
                        "좋은 예(형식만):\n"
                        "전반 정서는 ○○ 쪽으로 기울며 피로·긴장이 배경에 깔려 있습니다.\n"
                        "특히 △△ 언급에서 감정 강도가 흔들려 □□가 촉발 요인으로 나타납니다.\n"
                        "현재 필요한 것은 ▽▽(안정/정리/휴식 등)에 가깝고 스스로 인지한 자원은 ◇◇ 입니다.\n"
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "다음은 하루치 대화 로그(사용자 발화만 추린 것)입니다.\n"
                        "사실·사건 요약이 아니라 '감정 상태'만 3줄로 작성하세요.\n"
                        "전반 정서 톤, 감정 변화/촉발 요인, 현재 필요/자원을 중심으로 하되,\n"
                        "조언·해결책·계획·리캡은 쓰지 마세요. 정확히 3줄, 각 줄 1문장.\n\n"
                        f"{text}"
                    )
                }
            ]
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
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    chats_list = await chat.get_user_chats(db, user_id)
    dates = sorted({c["timestamp"].strftime("%Y-%m-%d") for c in chats_list}, reverse=True)
    return dates


# ---------------------------------------------------------
# 2) 특정 날짜의 전체 대화 (시간순 정렬)  ※ 경로 충돌 방지 → /by-date/{date}
# ---------------------------------------------------------
@router.get("/by-date/{date}")
async def get_chats_by_date(
    date: str,
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    chats_list = await chat.get_user_chats(db, user_id)
    results = []

    for c in chats_list:
        chat_date = c["timestamp"].strftime("%Y-%m-%d")
        if chat_date == date:
            results.append({
                "sender": "user",
                "message": c.get("user_message"),
                "timestamp": c["timestamp"]
            })
            results.append({
                "sender": "bot",
                "message": c.get("bot_reply"),
                "timestamp": c["timestamp"]
            })

    results.sort(key=lambda x: x["timestamp"])

    return {
        "date": date,
        "messages": results
    }


# ---------------------------------------
# 3) 특정 날짜 전체 대화 요약 (YYYY-MM-DD)
# ---------------------------------------
@router.get("/summary-by-date")
async def summary_by_date(
    date: str = Query(..., description="YYYY-MM-DD"),
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
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
        "summary": summary
    }


# ---------------------------------------
# 4) 오늘 하루 전체 대화 요약 (서버 날짜 기준)
# ---------------------------------------
@router.get("/summary-today")
async def summary_today(
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    today_str = datetime.now().strftime("%Y-%m-%d")

    chats_list = await chat.get_user_chats(db, user_id)
    pairs = []
    for c in chats_list:
        chat_date = c["timestamp"].strftime("%Y-%m-%d")
        if chat_date == today_str:
            pairs.append({
                "sender": "user",
                "message": c.get("user_message"),
                "timestamp": c["timestamp"]
            })
            pairs.append({
                "sender": "bot",
                "message": c.get("bot_reply"),
                "timestamp": c["timestamp"]
            })

    pairs.sort(key=lambda x: x["timestamp"])

    text = _build_daily_text(pairs)
    summary = _summarize_daily(text)

    return {
        "ok": True,
        "user_id": user_id,
        "date": today_str,
        "count_messages": len(pairs),
        "summary": summary
    }


@router.delete("/reset")
async def reset_chat_logs(
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await chat.delete_user_chats(db, user_id)
    return {
        "ok": True,
        "message": "All chat logs deleted"
    }
