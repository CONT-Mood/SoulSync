from fastapi import APIRouter, Depends, HTTPException
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
async def submit_assessment(body: SubmitIn, db: AsyncIOMotorDatabase = Depends(get_database)):
    mx = SPECS[body.type]
    if body.total > mx:
        raise HTTPException(400, f"total must be <= {mx}")
    await db["users"].update_one(
        {"user_id": body.user_id},
        {"$set": {f"latest_assessments.{body.type}.raw": body.total}},
        upsert=True
    )
    return {"ok": True}
