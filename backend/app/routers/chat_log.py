from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
from app.crud import chat
from app.models.chat import ChatDBModel
from app.db.mongo import get_database

router = APIRouter(prefix="/chat-log", tags=["Chat Log"])

# 일별 대화 내역 목록을 최신순으로 반환
@router.get("/dates", response_model=List[str])
async def get_chat_dates(user_id: str = Query(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    chats = await chat.get_user_chats(db, user_id)
    dates = sorted({chat["timestamp"].strftime("%Y-%m-%d") for chat in chats}, reverse=True)
    return dates

# 특정 날짜에 해당하는 전체 대화 내역 반환
@router.get("/{data}")
async def get_chats_by_date(date: str, user_id: str = Query(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    chats = await chat.get_user_chats(db, user_id)
    results = []

    for chat in chats:
        chat_date = chat["timestamp"].strftime("%Y-%m-%d")
        if chat_date == date:
            results.append({
                "sender": "user",
                "message": chat["user_message"],
                "timestamp": chat["timestamp"]
            })
            results.append({
                "sender": "bot",
                "message": chat["bot_reply"],
                "timestamp": chat["timestamp"]
            })

    # 시간순 정렬 (혹시나 Mongo에서 대화 내역을 순서대로 정렬하지 않았을 때를 대비)
    results.sort(key=lambda x: x["timestamp"])

    return {
        "date": date,
        "messages": results
    }

"""
대화 내역 불러오는 함수 반환값 예시
{
    "date": "2025-05-06",
    "messages": [
    {
        "sender": "user",
        "message": "요즘 너무 무기력하고 아무것도 하기 싫어요.",
        "timestamp": "2025-05-06T04:30:00.000Z"
    },
    {
        "sender": "bot",
        "message": "그런 기분이 들 땐 잠시 멈춰서 쉬는 것도 중요해요. 당신은 충분히 잘하고 있어요.",
        "timestamp": "2025-05-06T04:30:00.000Z"
    }
    ]
}
"""