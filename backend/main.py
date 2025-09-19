from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, chat_log
import openai
import os
from dotenv import load_dotenv
from app.user import user_router

load_dotenv()

# OpenAI API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="SoulSync API", version="1.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시에는 실제 도메인만 허용 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧩 라우터 등록
app.include_router(chat.router)                 # 기존 챗봇 라우터
app.include_router(chat_log.router)
app.include_router(user_router.router, prefix="/user")

@app.get("/")
def root():
    return {"message": "SoulSync API is running."}

