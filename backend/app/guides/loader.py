import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

_GUIDES: Dict[str, Any] = {}

def load_guides(base_dir: str) -> None:
    """앱 시작 시 guides/*.json 모두 읽어 메모리에 캐시"""
    global _GUIDES
    _GUIDES = {}
    p = Path(base_dir)
    for fp in p.glob("*.json"):
        data = json.loads(fp.read_text(encoding="utf-8"))
        t = data.get("type")
        if not t:
            continue
        _GUIDES[t] = data

def all_guides() -> Dict[str, Any]:
    return _GUIDES

def _band_of(total: int, bands: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for b in bands:
        lo, hi = b["range"]
        if lo <= total <= hi:
            return b
    return None

def guidance_for(atype: str, total: int) -> Optional[Tuple[str, str]]:
    """
    atype: 'gad7'|'phq9'|'pss'|'mkpq16'
    return: (band_name, prompt_text) or None
    """
    g = _GUIDES.get(atype)
    if not g:
        return None
    max_score = g.get("max", 100)
    if total < 0 or total > max_score:
        return None
    b = _band_of(total, g.get("bands", []))
    if not b:
        return None
    return (b["name"], b["prompt"])
