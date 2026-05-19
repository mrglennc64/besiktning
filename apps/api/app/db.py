from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .config import settings

_engine = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def configured() -> bool:
    return bool(settings.database_url)


def engine():
    global _engine, _sessionmaker
    if not configured():
        raise RuntimeError("DATABASE_URL is not set")
    if _engine is None:
        _engine = create_async_engine(settings.database_url, future=True, echo=False)
        _sessionmaker = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


@asynccontextmanager
async def session() -> AsyncIterator[AsyncSession]:
    if _sessionmaker is None:
        engine()
    assert _sessionmaker is not None
    async with _sessionmaker() as s:
        yield s
