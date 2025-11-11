# summarize_day.py
import os, re, openai
from typing import List, Dict

openai.api_key = os.getenv("OPENAI_API_KEY")

# ✅ 감정 중심 3줄 요약 (불릿 금지)
SYSTEM = (
    "역할: 상담 대화 감정 요약가\n"
    "목표: 대화 로그로부터 사용자의 감정 상태만 간결히 요약\n"
    "규칙:\n"
    "- 한국어로 작성할 것\n"
    "- 반드시 줄바꿈 기준 '정확히 3줄'만 출력할 것\n"
    "- 각 줄은 1문장, 불릿/번호/제목/콜론/이모지 금지 (예: '-', '1.', '요약:' 등 금지)\n"
    "- 사실 재진술/이벤트 나열 금지: 감정의 결/변화/촉발 요인/욕구에 초점\n"
    "- 병명 단정·진단 표현 금지, 조언은 암시적으로만(명령형 지시 금지)\n"
    "지향 예시(형식만):\n"
    "전반 정서 톤(예: 불안이 높고 피로가 누적된 상태로 보입니다).\n"
    "대화 중 X에 대한 언급에서 감정 강도가 흔들리며 Y가 촉발 요인으로 드러납니다.\n"
    "현재 필요는 Z(예: 안심/정리/휴식)에 가깝고, 스스로 인지한 자원은 W로 보입니다.\n"
)

# 필요 시 최근 N개만 사용(너무 길면 모델 품질 저하 방지)
_MAX_LINES = 40
_MAX_CHARS = 6000

def _build_daily_text(messages: List[Dict]) -> str:
    """messages: [{role:'user'|'assistant', content:str, created_at: datetime}, ...] (시간순 정렬 전제)"""
    lines = []
    for m in messages[-_MAX_LINES:]:
        t = m.get("created_at")
        ts = t.strftime("%H:%M") if t else ""
        role = "내담자" if m.get("role") == "user" else "상담봇"
        txt = (m.get("content","") or "").replace("\r\n","\n").replace("\r","").strip()
        if not txt:
            continue
        lines.append(f"[{ts}] {role}: {txt}")
    joined = "\n".join(lines)
    # 전체 길이 상한
    return joined[-_MAX_CHARS:]

def _force_three_lines(text: str) -> str:
    """모델이 규칙을 어겨도 딱 3줄, 불릿 제거."""
    s = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()

    def clean(ln: str) -> str:
        # 불릿/번호/제목/콜론류 제거
        ln = re.sub(r"^\s*(?:[-–—•*]|[0-9]+\.)\s*", "", ln)
        ln = re.sub(r"^(?:요약|하루\s*요약|주요\s*주제|키워드|위험\s*신호|권장\s*조치|분석)\s*[:：]\s*", "", ln, flags=re.I)
        # 과한 명령형/진단 어휘 완화(선택적 미세정리)
        ln = re.sub(r"(진단|치료|확정)", "평가", ln)
        return ln.strip()

    raw_lines = [clean(ln) for ln in s.split("\n") if ln.strip()]

    if len(raw_lines) >= 3:
        return "\n".join(raw_lines[:3])

    # 줄이 모자라면 문장 분리로 보정
    joined = " ".join(raw_lines) if raw_lines else s
    sentences = [clean(x) for x in re.split(r"(?<=[.!?。！？])\s+", joined) if x.strip()]
    if len(sentences) >= 3:
        return "\n".join(sentences[:3])

    # 그래도 부족하면 있는 것만 반환(최소 손질)
    return "\n".join((sentences or raw_lines)[:3])

def summarize_daily(messages: List[Dict]) -> str:
    if not messages:
        return "해당 날짜에 대화가 없습니다."

    text = _build_daily_text(messages)

    resp = openai.ChatCompletion.create(
        model="gpt-4o",            # 기존 모델 그대로 유지
        temperature=0.3,
        max_tokens=300,
        messages=[
            {"role": "system", "content": SYSTEM},
            {
                "role": "user",
                "content": (
                    "다음은 하루치 대화 로그입니다.\n"
                    "사실 나열이 아니라 '감정 상태'만 2~3줄로 요약하세요.\n"
                    "전반 정서 톤, 감정 변화/촉발 요인, 현재 필요/자원을 중심으로 작성하세요.\n"
                    "도덕적 판단/의학적 진단/명령형 조언은 금지합니다.\n\n"
                    f"{text}"
                ),
            },
        ],
    )

    raw = resp["choices"][0]["message"]["content"].strip()
    return _force_three_lines(raw)
