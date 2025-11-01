from pydantic import BaseModel, Field
from typing import Optional, Literal

class ChatRequest(BaseModel):
    user_id: str
    character: Literal["cognitive", "trauma", "empath", "advisor"]
    message: str
    show_emotion_score: Optional[bool] = Field(False, description="감정 게이지 표시 여부")

class EmotionScore(BaseModel):
    depression: int = Field(..., ge=0, le=100)
    anxiety: int = Field(..., ge=0, le=100)
    lethargy: int = Field(..., ge=0, le=100)

class ChatResponse(BaseModel):
    reply: str
    emotion_score: Optional[EmotionScore] = None  # 사용자가 원할 경우만 포함
