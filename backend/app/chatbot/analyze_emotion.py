# app/chatbot/analyze_emotion.py

import openai
import os
from dotenv import load_dotenv
import json

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def analyze_emotion(user_message: str) -> dict:
    # ⭐ 프롬프트를 약간 더 짧게 정리
    prompt = f"""
너는 감정 분석 전문가야.

사용자 발화에서 '우울(depression)', '불안(anxiety)', '무기력(lethargy)' 정도를
0부터 100까지의 정수(integer)로 평가해.

규칙:
- 사용자가 표현한 감정과 맥락만 보고 추론해.
- 0은 거의 없음을, 100은 매우 강함을 의미해.
- 5, 10 단위로만 반복하지 말고 37, 64처럼 자연스러운 수치를 써.

반드시 아래 JSON 형식으로만 응답해. 설명, 문장, 코드블록은 절대 붙이지 마.

{{
  "depression": 73,
  "anxiety": 64,
  "lethargy": 39
}}

사용자 발화: "{user_message}"
"""

    try:
        # ⭐ 기본값 먼저 설정
        text = ""

        response = openai.ChatCompletion.create(
            # ⭐ 변경: gpt-4o-mini 로 다운그레이드 (속도↑, 비용↓)
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,          # ⭐ 감정 스코어라 0이 더 안정적
            max_tokens=80,            # ⭐ 응답 길이 강하게 제한
        )

        text = response["choices"][0]["message"]["content"].strip()

        # 코드블록 ```json / ``` 이 실수로 붙어오는 경우 방어
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text.removeprefix("```json").strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.removeprefix("```").strip()
        if clean_text.endswith("```"):
            clean_text = clean_text.removesuffix("```").strip()

        emotion = json.loads(clean_text)

        return {
            "depression": int(emotion.get("depression", 0)),
            "anxiety": int(emotion.get("anxiety", 0)),
            "lethargy": int(emotion.get("lethargy", 0)),
        }

    except Exception as e:
        # 여기서 print는 간단한 에러 디버그용 정도만 남겨도 됨
        print(f"\n❗Error parsing emotion response: {e}\nGPT returned:\n{text}")
        return {"depression": 0, "anxiety": 0, "lethargy": 0}
