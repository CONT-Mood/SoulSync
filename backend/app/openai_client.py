from __future__ import annotations
import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# backend/.env 로드
ENV = Path(__file__).resolve().parents[1] / ".env"  # backend/.env
if ENV.exists():
    load_dotenv(ENV)
else:
    load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not set")

client = OpenAI(api_key=api_key)

# 한곳에서 모델명 관리
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")
