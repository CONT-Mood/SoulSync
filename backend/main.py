from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, chat_log
import openai
import os
from dotenv import load_dotenv

load_dotenv()

# OpenAI API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="SoulSync API", version="1.0")

# CORS 설정 (프론트엔드에서 요청 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시에는 특정 origin만 허용!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(chat.router)
app.include_router(chat_log.router)

@app.get("/")
def root():
    return {"message": "SoulSync API is running."}