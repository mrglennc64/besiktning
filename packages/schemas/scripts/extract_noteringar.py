"""Extract noteringar catalog from SynaHus master docx into noteringar.json.

Ship-raw v0: groups paragraphs into title+body noteringar under each category
section. Confidence is "low" where the title/body split is heuristic — a later
curation pass should normalize ids, dedupe, and fill in byggnadsdel tags.

Usage:
    python extract_noteringar.py <input.docx> <output.json>
"""
from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path

KNOWN_CATEGORIES = [
    "MARK",
    "GRUNDLÄGGNING",
    "GRUNDLÄGGNING BETONGPLATTA ELLER SULOR",
    "BALKONG",
    "KÄLLARVÄGGAR",
    "VENTILATION",
    "DRÄNERING",
    "STOMME/YTTERVÄGGAR",
    "MELLANBJÄLKLAG",
    "FASAD",
    "FÖNSTER",
    "VIND",
    "YTTERTAK",
    "VÅTUTRYMMEN",
    "Bildbank",
    "Div iakttagelsefraser",
    "EL FRASER",
    "Altan",
]


def extract_paragraphs(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
    xml = re.sub(r"<w:tab[^/]*/>", "\t", xml)
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"<[^>]+>", "", xml)
    paras = [p.strip() for p in xml.split("\n")]
    return [p for p in paras if p]


def slugify(text: str, max_len: int = 60) -> str:
    s = text.lower()
    s = re.sub(r"[åä]", "a", s)
    s = re.sub(r"[ö]", "o", s)
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = s.strip("_")
    return s[:max_len] or "untitled"


def looks_like_title(p: str) -> bool:
    if len(p) > 120:
        return False
    if p.endswith((".", ":", "?", "!")) and not p.endswith(("etc.", "mm.")):
        return False
    if len(p.split()) > 12:
        return False
    return True


def parse(paragraphs: list[str]) -> list[dict]:
    cleaned = []
    for p in paragraphs:
        s = p.lstrip()
        if s.startswith("TOC ") or "PAGEREF" in s:
            continue
        if s.startswith("Fel! Bokmärket"):
            continue
        cleaned.append(s)

    entries: list[dict] = []
    current_category = "Allmänt"
    pending_title: str | None = None
    counters: dict[str, int] = {}

    def next_id(cat: str, title: str | None) -> str:
        cat_slug = slugify(cat, 30)
        counters[cat_slug] = counters.get(cat_slug, 0) + 1
        n = counters[cat_slug]
        if title:
            return f"{cat_slug}__{slugify(title, 40)}__{n:03d}"
        return f"{cat_slug}__untitled__{n:03d}"

    for p in cleaned:
        if p in KNOWN_CATEGORIES or p.rstrip(":") in KNOWN_CATEGORIES:
            current_category = p.rstrip(":")
            pending_title = None
            continue
        if looks_like_title(p):
            if pending_title is not None:
                entries.append({
                    "id": next_id(current_category, pending_title),
                    "category": current_category,
                    "title": pending_title,
                    "body": "",
                    "confidence": "low",
                    "note": "title without body paragraph",
                })
            pending_title = p
        else:
            entries.append({
                "id": next_id(current_category, pending_title),
                "category": current_category,
                "title": pending_title or "",
                "body": p,
                "confidence": "medium" if pending_title else "low",
            })
            pending_title = None

    if pending_title is not None:
        entries.append({
            "id": next_id(current_category, pending_title),
            "category": current_category,
            "title": pending_title,
            "body": "",
            "confidence": "low",
            "note": "trailing title without body",
        })

    return entries


def main() -> None:
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    paragraphs = extract_paragraphs(src)
    entries = parse(paragraphs)
    catalog = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://besiktning.app/schemas/noteringar.json",
        "title": "Katalog över noteringar och riskanalyser",
        "description": (
            "Auto-extracted v0 from SynaHus master docx. "
            "Each entry is a canonical observation (title) + standard risk/explanation text (body) "
            "scoped to a building category. Used by the photo-loop to match what the AI sees in a "
            "photo to a pre-vetted Swedish-language paragraph that goes into the utlåtande verbatim."
        ),
        "source": "SynaHus i Sverige AB noteringar, riskanalyser mm.docx",
        "extracted_at": "2026-05-26",
        "version": "0.1.0-raw",
        "entry_count": len(entries),
        "entries": entries,
    }
    dst.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    by_cat: dict[str, int] = {}
    for e in entries:
        by_cat[e["category"]] = by_cat.get(e["category"], 0) + 1
    print(f"wrote {len(entries)} entries to {dst}")
    for cat, n in sorted(by_cat.items(), key=lambda kv: -kv[1]):
        print(f"  {n:4d}  {cat}")


if __name__ == "__main__":
    main()
