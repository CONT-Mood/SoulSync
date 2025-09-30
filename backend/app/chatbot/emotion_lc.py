from __future__ import annotations
from typing import Dict
import os, re, json
from openai import OpenAI

client = OpenAI()
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")

_PROMPT = """다음 사용자 메시지의 정서 강도를 0~100 정수로만 JSON으로 반환하세요.
필드: depression, anxiety, lethargy.
설명 없이 JSON만 출력.

메시지:
{msg}
"""

def analyze_emotion_lc(message: str) -> Dict[str, int]:
    try:
        resp = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[{"role":"user","content":_PROMPT.format(msg=message)}],
            temperature=0.0,
        )
        txt = (resp.choices[0].message.content or "").strip()
        m = re.search(r'\{.*\}', txt, re.S)
        if m:
            data = json.loads(m.group(0))
            def clamp(x):
                try: return int(max(0, min(100, int(x))))
                except: return 0
            return {
                "depression": clamp(data.get("depression", 0)),
                "anxiety": clamp(data.get("anxiety", 0)),
                "lethargy": clamp(data.get("lethargy", 0)),
            }
    except Exception:
        pass
    return {"depression": 0, "anxiety": 0, "lethargy": 0}
