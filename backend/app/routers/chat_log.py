from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
from app.crud import chat
from app.db.mongo import get_database

# 요약 생성을 위한 OpenAI
import os, openai, re   # ⬅️ re 추가
openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter(prefix="/chat-log", tags=["Chat Log"])


# -----------------------------
# 내부 헬퍼: 요약 텍스트 구성
# -----------------------------
def _build_daily_text(pairs: List[dict]) -> str:
    lines = []
    for p in pairs:
        ts = p["timestamp"].strftime("%H:%M") if isinstance(p.get("timestamp"), datetime) else ""
        role = "내담자" if p.get("sender") == "user" else "상담봇"
        msg = (p.get("message") or "").strip()
        if msg:
            lines.append(f"[{ts}] {role}: {msg}")
    return "\n".join(lines)


# ✅ 추가: 모델이 길게/불릿으로 답해도 '정확히 3줄'만 남기는 후처리
def _force_three_lines(text: str) -> str:
    s = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()

    # 줄 앞의 불릿/번호/라벨 제거
    def clean(ln: str) -> str:
        ln = re.sub(r"^\s*(?:[-–—•*]|[0-9]+\.)\s*", "", ln)  # 불릿/번호
        ln = re.sub(
            r"^(?:하루\s*요약|주요\s*주제(?:\s*키워드)?|감정\s*변화(?:/\s*패턴)?|위험\s*신호|권장\s*조치)\s*[:：]\s*",
            "",
            ln,
            flags=re.I,
        )
        return ln.strip()

    lines = [clean(ln) for ln in s.split("\n") if ln.strip()]
    if len(lines) >= 3:
        return "\n".join(lines[:3])

    # 줄이 모자라면 문장 단위로 분리해 3개 채움
    joined = " ".join(lines) if lines else s
    sentences = [clean(x) for x in re.split(r"(?<=[.!?。！？])\s+", joined) if x.strip()]
    if len(sentences) >= 3:
        return "\n".join(sentences[:3])

    return "\n".join(sentences) if sentences else s


def _summarize_daily(text: str) -> str:
    if not text.strip():
        return "해당 날짜에 대화가 없습니다."
    try:
        # ⬇️ 프롬프트를 '정확히 3줄, 불릿/라벨 금지'로 변경 + max_tokens 가드
        resp = openai.ChatCompletion.create(
            model="gpt-4o",
            temperature=0.3,
            max_tokens=300,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "역할: 상담 대화 하루 요약가\n"
                        "규칙:\n"
                        "- 한국어로 작성할 것\n"
                        "- 반드시 줄바꿈 기준 '정확히 3줄'만 출력할 것\n"
                        "- 각 줄은 1문장, 불릿/번호/제목/라벨/콜론 금지 (예: '-', '1.', '하루 요약:' 금지)\n"
                        "예시:\n"
                        "첫째 줄 요약 문장\n"
                        "둘째 줄 요약 문장\n"
                        "셋째 줄 요약 문장\n"
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "다음은 하루치 대화 로그입니다. 위 규칙을 지켜 정확히 3줄로만 요약하세요.\n\n"
                        f"{text}"
                    )
                }
            ]
        )
        raw = resp["choices"][0]["message"]["content"].strip()
        return _force_three_lines(raw)   # ⬅️ 항상 3줄로 정규화
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
