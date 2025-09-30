from pathlib import Path
from typing import Dict

PROMPTS_DIR = Path(__file__).parent

_FILE_MAP = {
    "empathic": "character_empathic.jinja",
    "insightful": "character_insightful.jinja",
    "pragmatic": "character_pragmatic.jinja",
    "trauma_sensitive": "character_trauma_sensitive.jinja",
    # fallback
}

def _load(name: str) -> str:
    path = PROMPTS_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8")

def load_system_prompt(character: str) -> str:
    fname = _FILE_MAP.get(character, "character_empathic.jinja")
    return _load(fname)

def render(character: str, *, context: str, gauge: Dict[str, int], user_message: str = "", dialogue_summary: str = "") -> str:
    tpl = load_system_prompt(character)
    out = tpl
    out = out.replace("{{context}}", context)
    out = out.replace("{{dialogue_summary}}", dialogue_summary)
    out = out.replace("{{user_message}}", user_message)
    out = out.replace("{{gauge.depression}}", str(gauge.get("depression", 0)))
    out = out.replace("{{gauge.anxiety}}", str(gauge.get("anxiety", 0)))
    out = out.replace("{{gauge.lethargy}}", str(gauge.get("lethargy", 0)))
    return out
