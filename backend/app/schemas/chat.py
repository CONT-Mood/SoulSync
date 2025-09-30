# app/schemas/chat.py
from typing import Optional, Literal
from pydantic import BaseModel

class ChatRequest(BaseModel):
    user_id: str
    character: str
    message: str
    show_emotion_score: bool = False
    mode: Literal["basic", "rag"] = "basic"

class ChatResponse(BaseModel):
    reply: str
    emotion_score: Optional[dict] = None
    retrieval_count: Optional[int] = None
