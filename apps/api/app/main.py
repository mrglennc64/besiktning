from __future__ import annotations

from contextlib import asynccontextmanager
from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import db, schemas as schema_loader
from .config import settings
from .db_models import Base
from .models import (
    Protokoll,
    ProtokollCreate,
    ProtokollPatch,
    ProtokollSummary,
    Template,
)
from .admin import router as admin_router
from .auth import router as auth_router
from .members import router as members_router
from .news import router as news_router
from .storage import store


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # If DATABASE_URL is set, ensure tables exist (Alembic comes in M4).
    if db.configured():
        engine = db.engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="besiktning-api",
    version="0.0.1",
    description="Backend for the besiktning B2B SaaS.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(news_router)
app.include_router(members_router)
app.include_router(auth_router)
app.include_router(admin_router)

DEMO_USER = "demo"


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "storage": type(store).__name__}


@app.get("/schemas/{template}", tags=["schemas"])
def get_schema(template: Template) -> dict:
    return schema_loader.load_schema(template.value)


@app.get("/protokoll", response_model=list[ProtokollSummary], tags=["protokoll"])
async def list_protokoll() -> list[ProtokollSummary]:
    rows = await store.list_for_user(DEMO_USER)
    return [
        ProtokollSummary(
            id=p.id,
            template=p.template,
            number=p.number,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in rows
    ]


@app.post("/protokoll", response_model=Protokoll, status_code=201, tags=["protokoll"])
async def create_protokoll(body: ProtokollCreate) -> Protokoll:
    return await store.create(user_id=DEMO_USER, template=body.template, number=body.number)


@app.get("/protokoll/{protokoll_id}", response_model=Protokoll, tags=["protokoll"])
async def get_protokoll(protokoll_id: UUID) -> Protokoll:
    p = await store.get(protokoll_id)
    if p is None:
        raise HTTPException(404, "protokoll not found")
    return p


@app.patch("/protokoll/{protokoll_id}", response_model=Protokoll, tags=["protokoll"])
async def patch_protokoll(protokoll_id: UUID, body: ProtokollPatch) -> Protokoll:
    p = await store.patch_data(protokoll_id, body.data)
    if p is None:
        raise HTTPException(404, "protokoll not found")
    return p


@app.delete("/protokoll/{protokoll_id}", status_code=204, tags=["protokoll"])
async def delete_protokoll(protokoll_id: UUID) -> None:
    ok = await store.delete(protokoll_id)
    if not ok:
        raise HTTPException(404, "protokoll not found")
