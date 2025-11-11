from typing import Literal, List, Dict, Optional

CharacterType = Literal["cognitive", "trauma", "empath", "advisor"]

SAFE_PREAMBLE = """너는 상담봇 'SoulSync'다.
- 네 호칭은 항상 'SoulSync' 또는 '상담봇'이다.
- 사용자의 이름은 사용자 이름일 뿐, 너의 이름이 아니다.
- 사용자의 감정을 가볍게 넘기지 말고 진심으로 공감하며 말해라.
- 마크다운 서식(별표, 샵, 리스트 등) 사용하지 마라.
"""

CHARACTER_PROMPTS = {
    "cognitive": "논리적으로 사고와 감정을 분석하며, 차분하게 통찰과 작은 실천 방법을 제안해라.",
    "trauma": "불안과 상처에 조심스럽게 반응하고, 부드럽게 공감하며 안전감을 주는 말로 위로해라.",
    "empath": "따뜻한 말투로 깊이 공감하고, 현실적으로 도움이 될 작은 제안을 덧붙여라.",
    "advisor": "감정을 존중하되 현실적인 해결책을 제시하고, 바로 실행 가능한 방향을 알려줘라."
}

def generate_character_prompt(character: CharacterType, user_message: str) -> str:
    base_instruction = CHARACTER_PROMPTS.get(character, "")
    return f"""{SAFE_PREAMBLE}

너는 {base_instruction}
사용자의 말에 공감하고 상황을 간단히 정리한 뒤, 도움이 되는 조언이나 방법을 제시해라.
길이는 4~7문장 정도로 자연스럽게 말해라.

사용자 메시지:
"{user_message}"
"""

PERSONA_DECODE = {
    "cognitive": {"temperature": 0.2},
    "trauma": {"temperature": 0.35},
    "empath": {"temperature": 0.6},
    "advisor": {"temperature": 0.25},
}

HUMAN_VOICES = {
    "cognitive": "짧게 핵심 정리와 실천 포인트 제시",
    "trauma": "조심스럽게 공감하고 안정감을 주기",
    "empath": "따뜻한 말투로 공감과 작은 제안",
    "advisor": "현실적인 요약과 행동 방향 제시",
}

def get_persona_decode(character: CharacterType):
    return PERSONA_DECODE.get(character, {"temperature": 0.4})

def build_messages(
    character: CharacterType,
    user_message: str,
    history_pairs: Optional[List[Dict]] = None,
    rag_contexts: Optional[List[Dict]] = None
) -> List[Dict]:
    voice_hint = HUMAN_VOICES.get(character, "")
    system_block = f"""{SAFE_PREAMBLE}
{CHARACTER_PROMPTS.get(character, "")}

자연스러운 대화체로 말해라.
응답은 공감 + 정리 + 제안의 흐름으로 구성하고, 4~7문장 내외로 충분히 말해라.
필요하면 간단한 단계 예시를 포함해라.
말투는 캐릭터 특성을 유지하되 따뜻하고 현실적으로 해라.
힌트: {voice_hint}
"""

    msgs: List[Dict] = [{"role": "system", "content": system_block}]

    if rag_contexts:
        ctx_text = "\n\n".join(
            f"[{i}] {c.get('source', 'doc')}\n{(c.get('text') or '').strip()}"
            for i, c in enumerate(rag_contexts, 1)
        )
        msgs.append({"role": "user", "content": f"참고 자료:\n{ctx_text}"})

    if history_pairs:
        for p in history_pairs:
            m = (p.get("message") or "").strip()
            if not m:
                continue
            role = "assistant" if p.get("sender") != "user" else "user"
            msgs.append({"role": role, "content": m})

    msgs.append({"role": "user", "content": user_message})
    return msgs
