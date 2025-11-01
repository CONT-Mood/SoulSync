from typing import Literal, List, Dict, Optional

CharacterType = Literal["cognitive", "trauma", "empath", "advisor"]

# ✅ 모든 캐릭터 공통 안전 프리앰블
SAFE_PREAMBLE = """너는 상담봇 'SoulSync'다.
- 어떤 상황에서도 너 자신의 이름을 사람 이름(예: '이석환')으로 소개하지 마라.
- '저는 ~입니다/이라고 합니다'로 자기 이름을 말하지 마라.
- 네 호칭은 언제나 'SoulSync' 또는 '상담봇'으로 통일한다.
- 사용자가 자신의 이름을 말하더라도, 그건 '사용자 이름'일 뿐 너의 이름이 아니다.
"""

CHARACTER_PROMPTS = {
    "cognitive": """너는 인지적 통찰가형 상담사야.
사용자의 사고 패턴과 감정 흐름을 논리적으로 분석하고, 차분하고 명확한 말투로 설명해줘.
때로는 사용자가 보지 못하는 시야를 넓혀주는 깊이 있는 통찰을 제공해줘.
문제를 다각도로 분석하여 근본적인 해결책을 찾아주는 것이 특징이야.""",

    "trauma": """너는 트라우마 민감형 상담사야.
불안과 상처에 민감하게 반응하고, 매우 섬세하고 조심스러운 말투로 대화해줘.
어떤 말도 함부로 하지 않고, 말끝마다 진심이 느껴지게 응답해야 해.
트라우마와 심리적 상처에 특별히 민감하고 전문적인 도움을 제공해.""",

    "empath": """너는 공감적 경청가형 상담사야.
무조건적인 공감과 정서적 지지를 보내는 따뜻한 말투로 사용자에게 다가가줘.
"괜찮아", "그럴 수 있어", "이해해" 같은 위로의 표현도 잘 사용해줘.
당신의 이야기를 진심으로 들어주고 공감해주는 따뜻한 친구야.""",

    "advisor": """너는 현실적 조언가형 상담사야.
감정도 수용하되, 궁극적으로는 실질적인 해결책과 조언을 제공하는 실용적인 말투를 사용해줘.
말은 간결하고 핵심을 짚어줘.
실용적이고 현실적인 해결책을 제시해주는 신뢰할 수 있는 친구야."""
}

def generate_character_prompt(character: CharacterType, user_message: str) -> str:
    base_instruction = CHARACTER_PROMPTS.get(character, "")
    return f"""{SAFE_PREAMBLE}

{base_instruction}

다음은 사용자의 메시지야:
"{user_message}"

이 사용자에게 어울리는 말투와 스타일로 **4~6문장 이상의 진심 어린 상담 답변을 해줘**.
**각 문장은 줄바꿈(\\n)을 사용해서 자연스럽게 구분되게 해줘.**
"""

# ----------------------------
# 👇 아래부터 추가된 유틸들
# ----------------------------

# 캐릭터별 권장 temperature (말투 분화)
PERSONA_DECODE = {
    "cognitive": {"temperature": 0.2},
    "trauma":    {"temperature": 0.35},
    "empath":    {"temperature": 0.6},
    "advisor":   {"temperature": 0.25},
}

HUMAN_VOICES = {
    "cognitive": "번호 대신 핵심 통찰 한두 가지를 자연스럽게 말해라.",
    "trauma":    "짧고 조심스럽게, 안전감을 우선해라.",
    "empath":    "따뜻한 구어체로 공감 한마디와 작은 제안을 곁들여라.",
    "advisor":   "한 줄 요약 후 바로 실행 가능한 한 가지를 제시하라.",
}

def get_persona_decode(character: CharacterType):
    """캐릭터별 디코딩 파라미터(현재 temperature만 사용)."""
    return PERSONA_DECODE.get(character, {"temperature": 0.4})

def build_messages(
    character: CharacterType,
    user_message: str,
    history_pairs: Optional[List[Dict]] = None,
    rag_contexts: Optional[List[Dict]] = None
) -> List[Dict]:
    """
    ChatCompletion용 messages 생성.
    - 기존 SAFE_PREAMBLE / CHARACTER_PROMPTS 재사용
    - 사람이 말하듯 2~3문장 규칙을 강하게 부여
    - RAG가 있으면 user 컨텍스트 블록으로 보조 투입
    - history_pairs: [{sender: 'user'|'assistant', 'message': '...'}] 가정
    """
    voice_hint = HUMAN_VOICES.get(character, "")
    system_block = f"""{SAFE_PREAMBLE}

{CHARACTER_PROMPTS.get(character, "")}

- 사람과 대화하듯 자연스러운 구어체로 말해라. (어색한 보고서 톤 금지)
- 응답은 **짧고 핵심만**: 2~3개의 문장으로 끝내라.
- 목록/번호/과한 구조화는 피하라. (advisor라도 문장 안에서 간결히)
- 사실/수치/인용은 컨텍스트가 있을 때만 단정적으로 말해라. 없으면 추정임을 짧게 표시.
- 캐릭터의 성격(톤/태도)은 유지하되, 문장은 간결하고 담백하게.
- 이모지는 empath 캐릭터에서만 가볍게 1개 이하 (선택).

- 캐릭터별 인간적인 말하기 힌트: {voice_hint}
"""
    msgs: List[Dict] = [{"role": "system", "content": system_block}]

    # (선택) RAG 보조 컨텍스트
    if rag_contexts:
        lines = []
        for i, c in enumerate(rag_contexts, 1):
            src = c.get("source", "doc")
            txt = (c.get("text") or "").strip()
            lines.append(f"[{i}] {src}\n{txt}")
        ctx_text = "\n\n".join(lines)
        msgs.append({"role": "user", "content": f"<<컨텍스트 시작>>\n{ctx_text}\n<<컨텍스트 끝>>"})

    # (선택) 과거 대화 복원
    if history_pairs:
        for p in history_pairs:
            m = (p.get("message") or "").strip()
            if not m:
                continue
            role = "assistant" if p.get("sender") != "user" else "user"
            msgs.append({"role": role, "content": m})

    # 현재 유저 발화
    msgs.append({"role": "user", "content": user_message})
    return msgs
