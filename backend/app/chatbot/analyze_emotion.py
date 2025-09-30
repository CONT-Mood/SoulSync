import openai
import os
from dotenv import load_dotenv
import json

# .env 파일에서 OpenAI API 키 불러오기
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def analyze_emotion(user_message: str) -> dict:
    prompt = f"""
너는 감정 분석 전문가야.

사용자 발화에서 '우울(depression)', '불안(anxiety)', '무기력(lethargy)' 정도를 0부터 100까지의 **정수(integer)**로 평가해줘.
1단위 정밀도로 추정하고, 5단위, 10단위 수치로 반복하지 말고 61, 73, 47 같은 다양한 수치를 사용해.

❗주의: 반드시 아래 JSON 형식으로만 응답해야 해. 다른 텍스트는 절대 포함하지 마. reply, 설명, 문장 없이 **정확히 이 구조**만 응답해:

{{
  "depression": 73,
  "anxiety": 64,
  "lethargy": 39
}}

사용자 발화: "{user_message}"
"""

    try:
        text = ""  # <- 여기에 기본값을 먼저 설정
        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )

        text = response['choices'][0]['message']['content']
        print("GPT 응답:\n", text)

        # 코드블록 ```json 또는 ``` 제거 처리
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
            "lethargy": int(emotion.get("lethargy", 0))
        }

    except Exception as e:
        print(f"\n❗Error parsing response: {e}\nGPT returned:\n{text}")
        return {"depression": 0, "anxiety": 0, "lethargy": 0}