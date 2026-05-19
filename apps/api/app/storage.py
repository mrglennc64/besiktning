"""In-memory storage stub.

Swapped for Postgres + SQLAlchemy in milestone 4 once we have a managed DB
(Hetzner managed Postgres, Neon EU, or local docker-compose).

The interface intentionally matches what an async SQLAlchemy session will
expose, so the call sites in `app.routes` don't change when we migrate.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Iterable
from uuid import UUID

from .models import Protokoll, Template


def _now() -> datetime:
    return datetime.now(UTC)


class InMemoryStore:
    def __init__(self) -> None:
        self._protokoll: dict[UUID, Protokoll] = {}
        self._seq_by_user_year: dict[tuple[str, int], int] = {}

    def next_number(self, user_id: str, initials: str = "GC") -> str:
        year = _now().year
        key = (user_id, year)
        self._seq_by_user_year[key] = self._seq_by_user_year.get(key, 0) + 1
        return f"{initials}-{year}-{self._seq_by_user_year[key]:03d}"

    def create(self, *, user_id: str, template: Template, number: str | None) -> Protokoll:
        p = Protokoll(
            user_id=user_id,
            template=template,
            number=number or self.next_number(user_id),
        )
        self._protokoll[p.id] = p
        return p

    def get(self, protokoll_id: UUID) -> Protokoll | None:
        return self._protokoll.get(protokoll_id)

    def patch_data(self, protokoll_id: UUID, data: dict) -> Protokoll | None:
        p = self._protokoll.get(protokoll_id)
        if p is None:
            return None
        merged = {**p.data, **data}
        updated = p.model_copy(update={"data": merged, "updated_at": _now()})
        self._protokoll[protokoll_id] = updated
        return updated

    def delete(self, protokoll_id: UUID) -> bool:
        return self._protokoll.pop(protokoll_id, None) is not None

    def list_for_user(self, user_id: str) -> Iterable[Protokoll]:
        return [p for p in self._protokoll.values() if p.user_id == user_id]


store = InMemoryStore()
