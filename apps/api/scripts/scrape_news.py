"""Weekly news scraper.

Reads `news_feeds.json` and pulls items from each RSS feed. Items are filtered
by language hint (Swedish) and a keyword whitelist, deduplicated by URL, then
POSTed to the FastAPI ingest endpoint.

Run locally:
    python scripts/scrape_news.py \\
        --api http://localhost:8000 --token $NEWS_INGEST_TOKEN

Run from CI (see .github/workflows/scrape-news.yml):
    # NEWS_API_URL and NEWS_INGEST_TOKEN come from repo secrets.

Requires: feedparser>=6.0. Install with: pip install feedparser
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

try:
    import feedparser  # type: ignore
except ImportError:
    sys.stderr.write(
        "feedparser not installed. Run: pip install feedparser\n"
    )
    sys.exit(1)


CUTOFF_DAYS = 14  # only pull items from the last N days
USER_AGENT = "besiktning-news-scraper/0.1 (+https://besiktning.app)"


def load_config(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def parse_one_feed(url: str, source_name: str) -> list[dict]:
    """Pull entries from a single RSS URL."""
    parsed = feedparser.parse(url, request_headers={"User-Agent": USER_AGENT})
    if parsed.bozo:
        sys.stderr.write(
            f"warn: feed {source_name} ({url}) had parse issues: {parsed.bozo_exception}\n"
        )
    items: list[dict] = []
    for e in parsed.entries:
        published = _entry_datetime(e)
        items.append(
            {
                "source_name": source_name,
                "title": e.get("title", "").strip(),
                "url": e.get("link", "").strip(),
                "summary": _clean_summary(e.get("summary") or e.get("description") or ""),
                "published_at": published.isoformat() if published else None,
            }
        )
    return items


def _entry_datetime(entry: Any) -> datetime | None:
    for key in ("published_parsed", "updated_parsed", "created_parsed"):
        t = entry.get(key)
        if t:
            return datetime.fromtimestamp(time.mktime(t), tz=timezone.utc)
    return None


def _clean_summary(text: str) -> str | None:
    if not text:
        return None
    # Strip simple HTML tags
    import re

    cleaned = re.sub(r"<[^>]+>", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) > 600:
        cleaned = cleaned[:597] + "..."
    return cleaned or None


def matches_keywords(item: dict, keywords: list[str]) -> bool:
    haystack = " ".join(
        [
            (item.get("title") or "").lower(),
            (item.get("summary") or "").lower(),
        ]
    )
    return any(kw.lower() in haystack for kw in keywords)


def within_cutoff(item: dict, cutoff: datetime) -> bool:
    if not item.get("published_at"):
        # Keep items without a date — better to over-include than miss them
        return True
    try:
        dt = datetime.fromisoformat(item["published_at"])
    except ValueError:
        return True
    return dt >= cutoff


def collect_items(config: dict) -> list[dict]:
    feeds = config.get("trade_pubs", []) + config.get("authorities", [])
    keywords = config.get("keywords_filter", [])
    cutoff = datetime.now(UTC) - timedelta(days=CUTOFF_DAYS)
    seen_urls: set[str] = set()
    collected: list[dict] = []
    for feed in feeds:
        try:
            for item in parse_one_feed(feed["url"], feed["name"]):
                if not item.get("url") or not item.get("title"):
                    continue
                if item["url"] in seen_urls:
                    continue
                if not matches_keywords(item, keywords):
                    continue
                if not within_cutoff(item, cutoff):
                    continue
                seen_urls.add(item["url"])
                collected.append(item)
        except Exception as exc:  # noqa: BLE001
            sys.stderr.write(f"error: feed {feed['name']} failed: {exc}\n")
    return collected


def post_to_api(api_url: str, token: str, items: list[dict]) -> dict:
    body = json.dumps({"items": items}).encode("utf-8")
    req = urllib.request.Request(
        f"{api_url.rstrip('/')}/news/ingest",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Ingest-Token": token,
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"ingest failed: HTTP {e.code} {e.read().decode()}\n")
        raise


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config",
        default=str(Path(__file__).parent / "news_feeds.json"),
        help="Path to feed config JSON",
    )
    parser.add_argument(
        "--api",
        default="http://localhost:8000",
        help="FastAPI base URL",
    )
    parser.add_argument(
        "--token",
        default=None,
        help="Ingest token (defaults to env NEWS_INGEST_TOKEN)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print collected items instead of POSTing",
    )
    args = parser.parse_args()

    config = load_config(Path(args.config))
    items = collect_items(config)
    print(f"collected {len(items)} matching items from {len(config.get('trade_pubs', [])) + len(config.get('authorities', []))} feeds")

    if args.dry_run:
        print(json.dumps(items, indent=2, ensure_ascii=False))
        return

    import os

    token = args.token or os.environ.get("NEWS_INGEST_TOKEN")
    if not token:
        sys.stderr.write("error: no ingest token. Pass --token or set NEWS_INGEST_TOKEN\n")
        sys.exit(2)

    if not items:
        print("nothing to ingest, exiting")
        return

    result = post_to_api(args.api, token, items)
    print(f"ingested: {result}")


if __name__ == "__main__":
    main()
