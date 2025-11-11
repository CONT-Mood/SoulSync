# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import openai
from pathlib import Path

# --- 앱 라우터들 ---
from app.routers import chat, chat_log, assessment   # ← 중복 없이 한 줄로
from app.user import user_router                     # /user
from app.routers import crisis                       # /crisis
from app.rag.router import router as rag_router      # /rag (예: /rag/rebuild 등)

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

# --- 가이드 로더 ---
from app.guides.loader import load_guides

@app.on_event("startup")
async def _startup():
    # 작업 디렉터리에 의존하지 않도록 안전 경로 계산
    base_dir = Path(__file__).resolve().parent / "app" / "guides"
    load_guides(base_dir=str(base_dir))

# --- 라우터 등록 ---
app.include_router(chat.router)                        # 기존 챗봇 라우터
app.include_router(chat_log.router)                    # 대화 로그 라우터
app.include_router(user_router.router, prefix="/user") # 사용자 라우터
app.include_router(crisis.router)                      # 위기 대응 라우터
app.include_router(rag_router)                         # RAG 라우터(선택)
app.include_router(assessment.router)                  # 설문 점수 저장

# --- 헬스 체크 ---
@app.get("/")
def root():
    return {"message": "SoulSync API is running."}
