# summarize_day.py
import os, re, openai
from typing import List, Dict

openai.api_key = os.getenv("OPENAI_API_KEY")

# ✅ "정확히 3줄, 불릿 금지" 규칙
SYSTEM = (
    "역할: 상담 대화 하루 요약가\n"
    "규칙:\n"
    "- 한국어로 작성할 것\n"
    "- 반드시 줄바꿈 기준 '정확히 3줄'만 출력할 것\n"
    "- 각 줄은 1문장, 불릿/번호/제목/콜론 금지 (예: '-', '1.', '하루 요약:' 사용 금지)\n"
    "- 예시:\n"
    "첫째 줄 요약 문장\n"
    "둘째 줄 요약 문장\n"
    "셋째 줄 요약 문장\n"
)

def _build_daily_text(messages: List[Dict]) -> str:
    """messages: [{role:'user'|'assistant', content:str, created_at: datetime}, ...] (시간순 정렬 전제)"""
    lines = []
    for m in messages:
        t = m.get("created_at")
        ts = t.strftime("%H:%M") if t else ""
        role = "내담자" if m.get("role") == "user" else "상담봇"
        lines.append(f"[{ts}] {role}: {m.get('content','')}")
    return "\n".join(lines)

def _force_three_lines(text: str) -> str:
    """모델이 규칙을 어겨도 딱 3줄, 불릿 제거."""
    s = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()

    # 줄 단위로 긁어오고 불릿/번호/제목 패턴 제거
    def clean(ln: str) -> str:
        ln = re.sub(r"^\s*(?:[-–—•*]|[0-9]+\.)\s*", "", ln)       # 불릿/번호 제거
        ln = re.sub(r"^(?:하루\s*요약|주요\s*주제|키워드|위험\s*신호|권장\s*조치)\s*[:：]\s*", "", ln, flags=re.I)
        return ln.strip()

    raw_lines = [clean(ln) for ln in s.split("\n") if ln.strip()]

    if len(raw_lines) >= 3:
        return "\n".join(raw_lines[:3])

    # 줄이 모자라면 문장 단위로 분리해서 3개 채움
    joined = " ".join(raw_lines) if raw_lines else s
    sentences = [clean(x) for x in re.split(r"(?<=[.!?。！？])\s+", joined) if x.strip()]
    if len(sentences) >= 3:
        return "\n".join(sentences[:3])

    # 그래도 부족하면 있는 것만 반환
    return "\n".join(sentences) if sentences else s

def summarize_daily(messages: List[Dict]) -> str:
    if not messages:
        return "해당 날짜에 대화가 없습니다."

    text = _build_daily_text(messages)

    resp = openai.ChatCompletion.create(
        model="gpt-4o",
        temperature=0.3,
        max_tokens=300,  # 과도한 장문 방지
        messages=[
            {"role": "system", "content": SYSTEM},
            {
                "role": "user",
                "content": (
                    "다음은 하루치 대화 로그입니다. 위 규칙을 지켜 **정확히 3줄**로만 요약하세요.\n\n"
                    f"{text}"
                ),
            },
        ],
    )

    raw = resp["choices"][0]["message"]["content"].strip()
    return _force_three_lines(raw)
