from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime config.

    DATABASE_URL is the only switch that matters for storage:
      - unset / empty: in-memory store (good for tests, demos)
      - set:           Postgres via asyncpg (use `postgresql+asyncpg://...`)

    Drop a `.env` file in apps/api/ for local dev. Production sets real env vars.
    """

    database_url: str = ""
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    default_user_initials: str = "GC"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
