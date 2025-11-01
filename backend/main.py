# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import openai

# --- 앱 라우터들 ---
from app.routers import chat, chat_log
from app.user import user_router            # /user
from app.routers import crisis              # /crisis
from app.rag.router import router as rag_router  # /rag (예: /rag/rebuild 등)

# --- 환경변수 로드 & OpenAI 키 설정 ---
load_dotenv()  # backend/.env 로드
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="SoulSync API", version="1.0")

# --- CORS 설정 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # 배포 시 실제 도메인만 허용 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 라우터 등록 ---
app.include_router(chat.router)                     # 기존 챗봇 라우터
app.include_router(chat_log.router)                 # 대화 로그 라우터
app.include_router(user_router.router, prefix="/user")  # 사용자 라우터
app.include_router(crisis.router)                   # 팀원 추가: 위기 대응 라우터
app.include_router(rag_router)                      # 네가 추가: RAG 라우터

# --- 헬스 체크 ---
@app.get("/")
def root():
    return {"message": "SoulSync API is running."}
