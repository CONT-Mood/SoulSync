from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_database

router = APIRouter(prefix="/assessment", tags=["Assessment"])

SPECS = {"phq9": 27, "gad7": 21, "pss": 40, "mkpq16": 48}


class SubmitIn(BaseModel):
    user_id: str
    type: str = Field(..., pattern="^(phq9|gad7|pss|mkpq16)$")
    total: int = Field(..., ge=0)


@router.post("/submit")
async def submit_assessment(
    body: SubmitIn,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    mx = SPECS[body.type]
    if body.total > mx:
        raise HTTPException(400, f"total must be <= {mx}")
    await db["users"].update_one(
        {"user_id": body.user_id},
        {"$set": {f"latest_assessments.{body.type}.raw": body.total}},
        upsert=True,
    )
    return {"ok": True}


@router.delete("/reset")
async def reset_assessments(
    user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    특정 사용자의 모든 진단 결과(latest_assessments)를 초기화
    채팅 초기화 버튼에서 같이 호출해서 사용.
    """
    await db["users"].update_one(
        {"user_id": user_id},
        {"$unset": {"latest_assessments": ""}},
    )
    return {
        "ok": True,
        "message": "All assessment results deleted",
    }
