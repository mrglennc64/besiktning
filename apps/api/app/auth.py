"""Magic-link auth.

Flow:
    1. POST /auth/request { email }
       → creates a one-time token (1h TTL), logs the magic link.
    2. POST /auth/exchange { token }
       → verifies + marks used, creates a session (30d), returns session token + email + is_admin.
    3. GET /auth/me with Authorization: Bearer <session_token>
       → returns the current user.

In dev the magic link is just printed to the API console — grab it from there.
When SMTP is wired (later) the link goes by email instead.

Admin gating uses ADMIN_EMAIL env var (single user). Multi-admin support comes
when there's actually a need for it.
"""
from __future__ import annotations

import logging
import secrets
from collections.abc import Iterable
from datetime import UTC, datetime, timedelta
from typing import Protocol
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from . import db
from .config import settings
from .db_models import AuthTokenRow, SessionRow

log = logging.getLogger(__name__)

TOKEN_TTL = timedelta(hours=1)
SESSION_TTL = timedelta(days=30)


def _now() -> datetime:
    return datetime.now(UTC)


def _admin_email() -> str | None:
    return settings.admin_email or None


def _is_admin(email: str) -> bool:
    admin = _admin_email()
    return bool(admin) and email.lower() == admin.lower()


# --- Pydantic ---


class LoginRequest(BaseModel):
    email: EmailStr


class ExchangeRequest(BaseModel):
    token: str


class PasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str


class Session(BaseModel):
    email: EmailStr
    session_token: str
    expires_at: datetime
    is_admin: bool


class CurrentUser(BaseModel):
    email: EmailStr
    is_admin: bool


# --- Store ---


class AuthStore(Protocol):
    async def create_token(self, email: str) -> str: ...
    async def exchange(self, token: str) -> tuple[str, datetime] | None: ...
    async def lookup_session(self, session_token: str) -> str | None: ...
    async def revoke_session(self, session_token: str) -> bool: ...
    async def create_session(self, email: str) -> tuple[str, datetime]: ...


class InMemoryAuthStore:
    def __init__(self) -> None:
        self._tokens: dict[str, tuple[str, datetime, datetime | None]] = {}  # token -> (email, exp, used_at)
        self._sessions: dict[str, tuple[str, datetime]] = {}  # token -> (email, exp)

    async def create_token(self, email: str) -> str:
        tok = secrets.token_urlsafe(32)
        self._tokens[tok] = (email, _now() + TOKEN_TTL, None)
        return tok

    async def exchange(self, token: str) -> tuple[str, datetime] | None:
        rec = self._tokens.get(token)
        if not rec:
            return None
        email, exp, used = rec
        if used or _now() > exp:
            return None
        self._tokens[token] = (email, exp, _now())
        session_tok = secrets.token_urlsafe(32)
        session_exp = _now() + SESSION_TTL
        self._sessions[session_tok] = (email, session_exp)
        return (session_tok, session_exp)

    async def lookup_session(self, session_token: str) -> str | None:
        rec = self._sessions.get(session_token)
        if not rec:
            return None
        email, exp = rec
        if _now() > exp:
            self._sessions.pop(session_token, None)
            return None
        return email

    async def revoke_session(self, session_token: str) -> bool:
        return self._sessions.pop(session_token, None) is not None

    async def create_session(self, email: str) -> tuple[str, datetime]:
        session_tok = secrets.token_urlsafe(32)
        session_exp = _now() + SESSION_TTL
        self._sessions[session_tok] = (email, session_exp)
        return (session_tok, session_exp)


class PostgresAuthStore:
    async def create_token(self, email: str) -> str:
        tok = secrets.token_urlsafe(32)
        row = AuthTokenRow(email=email, token=tok, expires_at=_now() + TOKEN_TTL)
        async with db.session() as s:
            s.add(row)
            await s.commit()
        return tok

    async def exchange(self, token: str) -> tuple[str, datetime] | None:
        async with db.session() as s:
            row = (
                await s.execute(select(AuthTokenRow).where(AuthTokenRow.token == token))
            ).scalar_one_or_none()
            if not row or row.used_at or _now() > row.expires_at:
                return None
            row.used_at = _now()
            session_tok = secrets.token_urlsafe(32)
            session_exp = _now() + SESSION_TTL
            sess = SessionRow(email=row.email, token=session_tok, expires_at=session_exp)
            s.add(sess)
            await s.commit()
        return (session_tok, session_exp)

    async def lookup_session(self, session_token: str) -> str | None:
        async with db.session() as s:
            row = (
                await s.execute(select(SessionRow).where(SessionRow.token == session_token))
            ).scalar_one_or_none()
            if not row or _now() > row.expires_at:
                return None
            return row.email

    async def revoke_session(self, session_token: str) -> bool:
        async with db.session() as s:
            row = (
                await s.execute(select(SessionRow).where(SessionRow.token == session_token))
            ).scalar_one_or_none()
            if not row:
                return False
            await s.delete(row)
            await s.commit()
        return True

    async def create_session(self, email: str) -> tuple[str, datetime]:
        session_tok = secrets.token_urlsafe(32)
        session_exp = _now() + SESSION_TTL
        async with db.session() as s:
            s.add(SessionRow(email=email, token=session_tok, expires_at=session_exp))
            await s.commit()
        return (session_tok, session_exp)


auth_store: AuthStore = (
    PostgresAuthStore() if settings.database_url else InMemoryAuthStore()
)


# --- Dependencies ---


def _read_bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1].strip() or None


async def current_user(
    authorization: str | None = Header(default=None),
) -> CurrentUser:
    token = _read_bearer(authorization)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    email = await auth_store.lookup_session(token)
    if not email:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")
    return CurrentUser(email=email, is_admin=_is_admin(email))


async def require_admin(user: CurrentUser = Depends(current_user)) -> CurrentUser:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin only")
    return user


# --- Notifications (stub) ---


def send_magic_link(email: str, token: str) -> None:
    """v1: print to stdout (real SMTP/Resend later). Uvicorn's default logging
    config swallows module-level INFO, so print is the most reliable dev stand-in."""
    base = settings.web_base_url
    link = f"{base}/auth/verify?token={token}"
    print(
        "\n" + "=" * 72
        + f"\nMAGIC LINK for {email} — valid {int(TOKEN_TTL.total_seconds() // 60)} min:"
        + f"\n    {link}\n"
        + "=" * 72 + "\n",
        flush=True,
    )


# --- Router ---


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request", status_code=status.HTTP_204_NO_CONTENT)
async def request_login(body: LoginRequest) -> None:
    token = await auth_store.create_token(body.email)
    send_magic_link(body.email, token)
    # Always 204 — don't leak whether the email is registered.


@router.post("/password", response_model=Session)
async def password_login(body: PasswordLoginRequest) -> Session:
    """Admin shortcut: log in with email + ADMIN_PASSWORD.

    Only valid if the email matches ADMIN_EMAIL and ADMIN_PASSWORD is set.
    Magic-link is still the canonical flow for non-admin / production use.
    """
    expected_pw = settings.admin_password or None
    admin = _admin_email()
    if not expected_pw or not admin:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Password login not configured on server",
        )
    # Constant-time compare to avoid timing-leak on the password.
    if (
        body.email.lower() != admin.lower()
        or not secrets.compare_digest(body.password, expected_pw)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    session_token, expires_at = await auth_store.create_session(body.email)
    return Session(
        email=body.email,
        session_token=session_token,
        expires_at=expires_at,
        is_admin=True,
    )


@router.post("/exchange", response_model=Session)
async def exchange_token(body: ExchangeRequest) -> Session:
    result = await auth_store.exchange(body.token)
    if not result:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")
    session_token, expires_at = result
    # Look up the email via the session we just created
    email = await auth_store.lookup_session(session_token)
    if not email:  # shouldn't happen
        raise HTTPException(500, "Session creation failed")
    return Session(
        email=email,
        session_token=session_token,
        expires_at=expires_at,
        is_admin=_is_admin(email),
    )


@router.get("/me", response_model=CurrentUser)
async def me(user: CurrentUser = Depends(current_user)) -> CurrentUser:
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(authorization: str | None = Header(default=None)) -> None:
    tok = _read_bearer(authorization)
    if tok:
        await auth_store.revoke_session(tok)
