from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_DIR = REPO_ROOT / "packages" / "schemas"

TEMPLATES = ("apartment", "smahus", "house", "overlatelse")


@lru_cache(maxsize=8)
def load_schema(template: str) -> dict:
    if template not in TEMPLATES:
        raise ValueError(f"unknown template: {template!r}")
    path = SCHEMA_DIR / f"{template}.json"
    if not path.exists():
        raise FileNotFoundError(f"schema not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_common() -> dict:
    return json.loads((SCHEMA_DIR / "common.json").read_text(encoding="utf-8"))
