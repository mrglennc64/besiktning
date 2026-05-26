"""Member application intake.

For v1 the member directory itself is hardcoded on the web side (Carina is the
only confirmed member). This module just handles the public application form
on /medlemmar — applications land as pending, Carina reviews them.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Literal, Protocol
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, HttpUrl
from sqlalchemy import select

from . import db
from .config import settings
from .db_models import MemberApplicationRow
from .news import email_domain_blocked

log = logging.getLogger(__name__)


ApplicationStatus = Literal["pending", "accepted", "rejected"]


class MemberApplication(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    foretag: str | None = None
    region: str | None = None
    specialitet: str | None = None
    webbplats: HttpUrl | None = None
    motivering: str | None = None
    status: ApplicationStatus
    moderator_note: str | None = None
    created_at: datetime
    updated_at: datetime


class MemberApplicationCreate(BaseModel):
    name: str
    email: EmailStr
    foretag: str | None = None
    region: str | None = None
    specialitet: str | None = None
    webbplats: HttpUrl | None = None
    motivering: str | None = None


class MemberStore(Protocol):
    async def apply(self, sub: MemberApplicationCreate) -> MemberApplication: ...
    async def list_pending(self) -> list[MemberApplication]: ...
    async def set_status(
        self, app_id: UUID, new_status: ApplicationStatus
    ) -> MemberApplication | None: ...


def _now() -> datetime:
    return datetime.now(UTC)


class InMemoryMemberStore:
    def __init__(self) -> None:
        self._apps: dict[UUID, MemberApplication] = {}

    async def apply(self, sub: MemberApplicationCreate) -> MemberApplication:
        now = _now()
        app = MemberApplication(
            id=uuid4(),
            name=sub.name,
            email=sub.email,
            foretag=sub.foretag,
            region=sub.region,
            specialitet=sub.specialitet,
            webbplats=sub.webbplats,
            motivering=sub.motivering,
            status="pending",
            moderator_note=None,
            created_at=now,
            updated_at=now,
        )
        self._apps[app.id] = app
        return app

    async def list_pending(self) -> list[MemberApplication]:
        pending = [a for a in self._apps.values() if a.status == "pending"]
        pending.sort(key=lambda a: a.created_at, reverse=True)
        return pending

    async def set_status(
        self, app_id: UUID, new_status: ApplicationStatus
    ) -> MemberApplication | None:
        app = self._apps.get(app_id)
        if not app:
            return None
        updated = app.model_copy(update={"status": new_status, "updated_at": _now()})
        self._apps[app_id] = updated
        return updated


class PostgresMemberStore:
    async def list_pending(self) -> list[MemberApplication]:
        async with db.session() as s:
            rows = (
                await s.execute(
                    select(MemberApplicationRow)
                    .where(MemberApplicationRow.status == "pending")
                    .order_by(MemberApplicationRow.created_at.desc())
                )
            ).scalars().all()
        return [_row_to_model(r) for r in rows]

    async def set_status(
        self, app_id: UUID, new_status: ApplicationStatus
    ) -> MemberApplication | None:
        async with db.session() as s:
            row = await s.get(MemberApplicationRow, app_id)
            if not row:
                return None
            row.status = new_status
            row.updated_at = _now()
            await s.commit()
            await s.refresh(row)
        return _row_to_model(row)

    async def apply(self, sub: MemberApplicationCreate) -> MemberApplication:
        row = MemberApplicationRow(
            name=sub.name,
            email=sub.email,
            foretag=sub.foretag,
            region=sub.region,
            specialitet=sub.specialitet,
            webbplats=str(sub.webbplats) if sub.webbplats else None,
            motivering=sub.motivering,
        )
        async with db.session() as s:
            s.add(row)
            await s.commit()
            await s.refresh(row)
        return _row_to_model(row)


def _row_to_model(row: MemberApplicationRow) -> MemberApplication:
    return MemberApplication(
        id=row.id,
        name=row.name,
        email=row.email,
        foretag=row.foretag,
        region=row.region,
        specialitet=row.specialitet,
        webbplats=row.webbplats,
        motivering=row.motivering,
        status=row.status,  # type: ignore[arg-type]
        moderator_note=row.moderator_note,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


member_store: MemberStore = (
    PostgresMemberStore() if settings.database_url else InMemoryMemberStore()
)


def notify_carina_of_application(app: MemberApplication) -> None:
    """Log the application. Real SMTP/Resend comes in a later pass."""
    log.info(
        "NEW MEMBER APPLICATION pending review — id=%s name=%r email=%s foretag=%r region=%r",
        app.id,
        app.name,
        app.email,
        app.foretag,
        app.region,
    )


router = APIRouter(prefix="/members", tags=["members"])


@router.post("/apply", response_model=MemberApplication, status_code=status.HTTP_201_CREATED)
async def apply_for_membership(sub: MemberApplicationCreate) -> MemberApplication:
    if not sub.name.strip() or not sub.email:
        raise HTTPException(400, "name and email are required")
    if email_domain_blocked(sub.email):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Applications from this email domain are not accepted.",
        )
    app = await member_store.apply(sub)
    notify_carina_of_application(app)
    return app
