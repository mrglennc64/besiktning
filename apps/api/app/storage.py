"""Storage layer.

Two backends behind one interface:

  - InMemoryStore: zero-config; used in tests and when DATABASE_URL is empty.
  - PostgresStore: real Postgres (Neon EU / Hetzner / etc) via SQLAlchemy async.

`store` is a module-level singleton chosen at import time based on
`settings.database_url`. Call sites in `app.main` stay identical.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Iterable, Protocol
from uuid import UUID

from sqlalchemy import select

from . import db
from .config import settings
from .db_models import ProtokollRow
from .models import Protokoll, Template


def _now() -> datetime:
    return datetime.now(UTC)


class Store(Protocol):
    def next_number(self, user_id: str, initials: str = ...) -> str: ...
    async def create(
        self, *, user_id: str, template: Template, number: str | None
    ) -> Protokoll: ...
    async def get(self, protokoll_id: UUID) -> Protokoll | None: ...
    async def patch_data(self, protokoll_id: UUID, data: dict) -> Protokoll | None: ...
    async def delete(self, protokoll_id: UUID) -> bool: ...
    async def list_for_user(self, user_id: str) -> Iterable[Protokoll]: ...


class InMemoryStore:
    def __init__(self) -> None:
        self._protokoll: dict[UUID, Protokoll] = {}
        self._seq_by_user_year: dict[tuple[str, int], int] = {}

    def next_number(self, user_id: str, initials: str = "GC") -> str:
        year = _now().year
        key = (user_id, year)
        self._seq_by_user_year[key] = self._seq_by_user_year.get(key, 0) + 1
        return f"{initials}-{year}-{self._seq_by_user_year[key]:03d}"

    async def create(
        self, *, user_id: str, template: Template, number: str | None
    ) -> Protokoll:
        p = Protokoll(
            user_id=user_id,
            template=template,
            number=number or self.next_number(user_id, settings.default_user_initials),
        )
        self._protokoll[p.id] = p
        return p

    async def get(self, protokoll_id: UUID) -> Protokoll | None:
        return self._protokoll.get(protokoll_id)

    async def patch_data(self, protokoll_id: UUID, data: dict) -> Protokoll | None:
        p = self._protokoll.get(protokoll_id)
        if p is None:
            return None
        merged = _deep_merge(p.data, data)
        updated = p.model_copy(update={"data": merged, "updated_at": _now()})
        self._protokoll[protokoll_id] = updated
        return updated

    async def delete(self, protokoll_id: UUID) -> bool:
        return self._protokoll.pop(protokoll_id, None) is not None

    async def list_for_user(self, user_id: str) -> Iterable[Protokoll]:
        return [p for p in self._protokoll.values() if p.user_id == user_id]


class PostgresStore:
    def __init__(self) -> None:
        self._seq_by_user_year: dict[tuple[str, int], int] = {}  # in-process cache

    def next_number(self, user_id: str, initials: str = "GC") -> str:
        # Naive next-number — replaced by a Postgres sequence in M4
        # when we have real users + RLS. For now this is fine for one inspector.
        year = _now().year
        key = (user_id, year)
        self._seq_by_user_year[key] = self._seq_by_user_year.get(key, 0) + 1
        return f"{initials}-{year}-{self._seq_by_user_year[key]:03d}"

    async def create(
        self, *, user_id: str, template: Template, number: str | None
    ) -> Protokoll:
        row = ProtokollRow(
            user_id=user_id,
            template=template,
            number=number or self.next_number(user_id, settings.default_user_initials),
            data={},
        )
        async with db.session() as s:
            s.add(row)
            await s.commit()
            await s.refresh(row)
        return _row_to_model(row)

    async def get(self, protokoll_id: UUID) -> Protokoll | None:
        async with db.session() as s:
            row = await s.get(ProtokollRow, protokoll_id)
        return _row_to_model(row) if row else None

    async def patch_data(self, protokoll_id: UUID, data: dict) -> Protokoll | None:
        async with db.session() as s:
            row = await s.get(ProtokollRow, protokoll_id)
            if row is None:
                return None
            row.data = _deep_merge(row.data or {}, data)
            row.updated_at = _now()
            await s.commit()
            await s.refresh(row)
        return _row_to_model(row)

    async def delete(self, protokoll_id: UUID) -> bool:
        async with db.session() as s:
            row = await s.get(ProtokollRow, protokoll_id)
            if row is None:
                return False
            await s.delete(row)
            await s.commit()
        return True

    async def list_for_user(self, user_id: str) -> Iterable[Protokoll]:
        async with db.session() as s:
            result = await s.execute(
                select(ProtokollRow).where(ProtokollRow.user_id == user_id)
            )
            rows = result.scalars().all()
        return [_row_to_model(r) for r in rows]


def _row_to_model(row: ProtokollRow) -> Protokoll:
    return Protokoll(
        id=row.id,
        user_id=row.user_id,
        template=row.template,
        number=row.number,
        data=row.data or {},
        status=row.status,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _deep_merge(base: dict, patch: dict) -> dict:
    """Recursive dict merge — patch wins, but nested dicts are merged not replaced.

    Critical for the autosave PATCH semantics: PATCH only sends the section
    being edited, and we don't want to wipe sibling sections.
    """
    out = dict(base)
    for k, v in patch.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


store: Store = PostgresStore() if settings.database_url else InMemoryStore()
