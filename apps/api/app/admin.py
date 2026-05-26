"""Admin endpoints — moderation for news submissions + member applications.

All routes here are gated by `require_admin` (must be ADMIN_EMAIL).
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from .auth import CurrentUser, require_admin
from .members import MemberApplication, member_store
from .news import NewsItem, news_store


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# --- News moderation ---


@router.get("/news/pending", response_model=list[NewsItem])
async def list_pending_news(_admin: CurrentUser = Depends(require_admin)) -> list[NewsItem]:
    return await news_store.list_pending()


@router.post("/news/{item_id}/approve", response_model=NewsItem)
async def approve_news(item_id: UUID, _admin: CurrentUser = Depends(require_admin)) -> NewsItem:
    item = await news_store.set_status(item_id, "published")
    if not item:
        raise HTTPException(404, "Not found")
    return item


@router.post("/news/{item_id}/reject", response_model=NewsItem)
async def reject_news(item_id: UUID, _admin: CurrentUser = Depends(require_admin)) -> NewsItem:
    item = await news_store.set_status(item_id, "rejected")
    if not item:
        raise HTTPException(404, "Not found")
    return item


# --- Member moderation ---


@router.get("/members/pending", response_model=list[MemberApplication])
async def list_pending_members(_admin: CurrentUser = Depends(require_admin)) -> list[MemberApplication]:
    return await member_store.list_pending()


@router.post("/members/{app_id}/accept", response_model=MemberApplication)
async def accept_member(app_id: UUID, _admin: CurrentUser = Depends(require_admin)) -> MemberApplication:
    app = await member_store.set_status(app_id, "accepted")
    if not app:
        raise HTTPException(404, "Not found")
    return app


@router.post("/members/{app_id}/reject", response_model=MemberApplication)
async def reject_member(app_id: UUID, _admin: CurrentUser = Depends(require_admin)) -> MemberApplication:
    app = await member_store.set_status(app_id, "rejected")
    if not app:
        raise HTTPException(404, "Not found")
    return app
