"""Small shared helpers."""

import re

_DASH_RE = re.compile(r"\s*[—–]\s*")  # em / en dash
_MULTISPACE_RE = re.compile(r"\s+")


def no_dash(text: str) -> str:
    """Remove em/en dashes from any displayed text (product style rule)."""
    if not text:
        return text
    out = _DASH_RE.sub(", ", text)
    out = out.replace(" ,", ",").replace(",,", ",")
    return _MULTISPACE_RE.sub(" ", out).strip()


def clean(text: str) -> str:
    return _MULTISPACE_RE.sub(" ", text or "").strip()


def hash_id(value: str) -> str:
    """Stable short id (djb2) so an event keeps its id across refreshes."""
    h = 5381
    for ch in value:
        h = ((h << 5) + h + ord(ch)) & 0xFFFFFFFF
    return format(h, "x")


def truncate(text: str, limit: int = 220) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit]
    space = cut.rfind(" ")
    return cut[: space if space > 0 else limit].rstrip() + "…"
