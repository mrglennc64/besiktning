from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(UTC)


class Template(str, Enum):
    apartment = "apartment"
    smahus = "smahus"
    house = "house"


class Status(str, Enum):
    draft = "draft"
    review = "review"
    final = "final"


class ProtokollCreate(BaseModel):
    template: Template
    number: str | None = Field(
        default=None,
        description="Optional inspector-provided number. Auto-generated if missing.",
    )


class ProtokollPatch(BaseModel):
    data: dict[str, Any]


class Protokoll(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: str = "demo"  # stub until M4 (magic-link auth)
    template: Template
    number: str
    data: dict[str, Any] = Field(default_factory=dict)
    status: Status = Status.draft
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class ProtokollSummary(BaseModel):
    id: UUID
    template: Template
    number: str
    status: Status
    created_at: datetime
    updated_at: datetime
