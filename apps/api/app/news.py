"""News feed: scraped industry items + member-submitted links + podcast episodes.

Three sources, one table. Public /nyheter shows status='published'; submissions
land as 'pending' and Carina approves them (admin endpoint or manual DB update).
"""
from __future__ import annotations

import logging
import os
from collections.abc import Iterable
from datetime import UTC, datetime
from typing import Literal, Protocol
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, HttpUrl
from sqlalchemy import select

from . import db
from .config import settings
from .db_models import NewsItemRow

log = logging.getLogger(__name__)


# Domains rejected on public submission forms (news + members).
# Reasoning: SynaHus is the platform's own company — submissions from that
# domain create a conflict-of-interest perception and would be self-promotion.
# Override via env: BLOCKED_SUBMITTER_DOMAINS="synahus.se,otherdomain.se"
def blocked_submitter_domains() -> set[str]:
    import os
    raw = os.environ.get("BLOCKED_SUBMITTER_DOMAINS", "synahus.se")
    return {d.strip().lower() for d in raw.split(",") if d.strip()}


def email_domain_blocked(email: str) -> bool:
    if "@" not in email:
        return False
    domain = email.rsplit("@", 1)[1].lower()
    return domain in blocked_submitter_domains()


# --- Models ---

SourceType = Literal["rss", "member", "podcast"]
NewsStatus = Literal["pending", "published", "rejected"]


class NewsItem(BaseModel):
    id: UUID
    source_type: SourceType
    source_name: str
    title: str
    url: HttpUrl
    summary: str | None = None
    published_at: datetime | None = None
    status: NewsStatus
    submitter_name: str | None = None
    submitter_email: EmailStr | None = None
    moderator_note: str | None = None
    created_at: datetime
    updated_at: datetime


class NewsSubmission(BaseModel):
    """Public form payload from /nyheter/skicka-in."""

    title: str
    url: HttpUrl
    summary: str | None = None
    submitter_name: str
    submitter_email: EmailStr


class IngestItem(BaseModel):
    """One item from the weekly RSS scraper."""

    source_name: str
    title: str
    url: HttpUrl
    summary: str | None = None
    published_at: datetime | None = None


class IngestBatch(BaseModel):
    items: list[IngestItem]


# --- Store ---


class NewsStore(Protocol):
    async def list_published(self, limit: int = 50) -> list[NewsItem]: ...
    async def list_pending(self) -> list[NewsItem]: ...
    async def submit(self, sub: NewsSubmission) -> NewsItem: ...
    async def ingest(self, items: list[IngestItem]) -> int: ...
    async def set_status(self, item_id: UUID, new_status: NewsStatus) -> NewsItem | None: ...


def _now() -> datetime:
    return datetime.now(UTC)


class InMemoryNewsStore:
    def __init__(self) -> None:
        self._items: dict[UUID, NewsItem] = {}

    async def list_published(self, limit: int = 50) -> list[NewsItem]:
        published = [i for i in self._items.values() if i.status == "published"]
        published.sort(
            key=lambda i: i.published_at or i.created_at, reverse=True
        )
        return published[:limit]

    async def list_pending(self) -> list[NewsItem]:
        pending = [i for i in self._items.values() if i.status == "pending"]
        pending.sort(key=lambda i: i.created_at, reverse=True)
        return pending

    async def set_status(self, item_id: UUID, new_status: NewsStatus) -> NewsItem | None:
        item = self._items.get(item_id)
        if not item:
            return None
        updated = item.model_copy(update={"status": new_status, "updated_at": _now()})
        self._items[item_id] = updated
        return updated

    async def submit(self, sub: NewsSubmission) -> NewsItem:
        now = _now()
        item = NewsItem(
            id=uuid4(),
            source_type="member",
            source_name=sub.submitter_name,
            title=sub.title,
            url=sub.url,
            summary=sub.summary,
            published_at=None,
            status="pending",
            submitter_name=sub.submitter_name,
            submitter_email=sub.submitter_email,
            moderator_note=None,
            created_at=now,
            updated_at=now,
        )
        self._items[item.id] = item
        return item

    async def ingest(self, items: list[IngestItem]) -> int:
        added = 0
        existing_urls = {str(i.url) for i in self._items.values()}
        now = _now()
        for it in items:
            if str(it.url) in existing_urls:
                continue
            n = NewsItem(
                id=uuid4(),
                source_type="rss",
                source_name=it.source_name,
                title=it.title,
                url=it.url,
                summary=it.summary,
                published_at=it.published_at,
                status="published",
                submitter_name=None,
                submitter_email=None,
                moderator_note=None,
                created_at=now,
                updated_at=now,
            )
            self._items[n.id] = n
            added += 1
        return added


class PostgresNewsStore:
    async def list_pending(self) -> list[NewsItem]:
        async with db.session() as s:
            rows = (
                await s.execute(
                    select(NewsItemRow)
                    .where(NewsItemRow.status == "pending")
                    .order_by(NewsItemRow.created_at.desc())
                )
            ).scalars().all()
        return [_row_to_model(r) for r in rows]

    async def set_status(self, item_id: UUID, new_status: NewsStatus) -> NewsItem | None:
        async with db.session() as s:
            row = await s.get(NewsItemRow, item_id)
            if not row:
                return None
            row.status = new_status
            row.updated_at = _now()
            await s.commit()
            await s.refresh(row)
        return _row_to_model(row)

    async def list_published(self, limit: int = 50) -> list[NewsItem]:
        async with db.session() as s:
            result = await s.execute(
                select(NewsItemRow)
                .where(NewsItemRow.status == "published")
                .order_by(
                    NewsItemRow.published_at.desc().nullslast(),
                    NewsItemRow.created_at.desc(),
                )
                .limit(limit)
            )
            rows = result.scalars().all()
        return [_row_to_model(r) for r in rows]

    async def submit(self, sub: NewsSubmission) -> NewsItem:
        row = NewsItemRow(
            source_type="member",
            source_name=sub.submitter_name,
            title=sub.title,
            url=str(sub.url),
            summary=sub.summary,
            published_at=None,
            status="pending",
            submitter_name=sub.submitter_name,
            submitter_email=sub.submitter_email,
        )
        async with db.session() as s:
            s.add(row)
            await s.commit()
            await s.refresh(row)
        return _row_to_model(row)

    async def ingest(self, items: list[IngestItem]) -> int:
        added = 0
        async with db.session() as s:
            existing = await s.execute(
                select(NewsItemRow.url).where(
                    NewsItemRow.url.in_([str(it.url) for it in items])
                )
            )
            existing_urls = {row for row in existing.scalars().all()}
            for it in items:
                if str(it.url) in existing_urls:
                    continue
                row = NewsItemRow(
                    source_type="rss",
                    source_name=it.source_name,
                    title=it.title,
                    url=str(it.url),
                    summary=it.summary,
                    published_at=it.published_at,
                    status="published",
                )
                s.add(row)
                added += 1
            await s.commit()
        return added


def _row_to_model(row: NewsItemRow) -> NewsItem:
    return NewsItem(
        id=row.id,
        source_type=row.source_type,  # type: ignore[arg-type]
        source_name=row.source_name,
        title=row.title,
        url=row.url,
        summary=row.summary,
        published_at=row.published_at,
        status=row.status,  # type: ignore[arg-type]
        submitter_name=row.submitter_name,
        submitter_email=row.submitter_email,
        moderator_note=row.moderator_note,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


news_store: NewsStore = (
    PostgresNewsStore() if settings.database_url else InMemoryNewsStore()
)


# --- Notifications (stub for v1) ---


def notify_carina_of_submission(item: NewsItem) -> None:
    """Log the submission. Real SMTP/Resend wiring comes in a later pass."""
    log.info(
        "NEW NEWS SUBMISSION pending review — id=%s title=%r from=%s <%s> url=%s",
        item.id,
        item.title,
        item.submitter_name,
        item.submitter_email,
        item.url,
    )


# --- Router ---

router = APIRouter(prefix="/news", tags=["news"])


def _check_ingest_token(x_ingest_token: str | None = Header(default=None)) -> None:
    expected = os.environ.get("NEWS_INGEST_TOKEN")
    if not expected:
        raise HTTPException(503, "Ingest disabled: NEWS_INGEST_TOKEN not set on server")
    if x_ingest_token != expected:
        raise HTTPException(401, "Invalid ingest token")


@router.get("", response_model=list[NewsItem])
async def list_news(limit: int = 50) -> list[NewsItem]:
    return await news_store.list_published(limit=limit)


@router.post("/submit", response_model=NewsItem, status_code=status.HTTP_201_CREATED)
async def submit_news(sub: NewsSubmission) -> NewsItem:
    if email_domain_blocked(sub.submitter_email):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Submissions from this email domain are not accepted.",
        )
    item = await news_store.submit(sub)
    notify_carina_of_submission(item)
    return item


@router.post("/ingest", dependencies=[Depends(_check_ingest_token)])
async def ingest_news(batch: IngestBatch) -> dict:
    added = await news_store.ingest(batch.items)
    return {"received": len(batch.items), "added": added}
