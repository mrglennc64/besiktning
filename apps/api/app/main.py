from __future__ import annotations

from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import schemas as schema_loader
from .models import (
    Protokoll,
    ProtokollCreate,
    ProtokollPatch,
    ProtokollSummary,
    Template,
)
from .storage import store

app = FastAPI(
    title="besiktning-api",
    version="0.0.1",
    description="Backend for the besiktning B2B SaaS.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_USER = "demo"


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/schemas/{template}", tags=["schemas"])
def get_schema(template: Template) -> dict:
    return schema_loader.load_schema(template.value)


@app.get("/protokoll", response_model=list[ProtokollSummary], tags=["protokoll"])
def list_protokoll() -> list[ProtokollSummary]:
    return [
        ProtokollSummary(
            id=p.id,
            template=p.template,
            number=p.number,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in store.list_for_user(DEMO_USER)
    ]


@app.post("/protokoll", response_model=Protokoll, status_code=201, tags=["protokoll"])
def create_protokoll(body: ProtokollCreate) -> Protokoll:
    return store.create(user_id=DEMO_USER, template=body.template, number=body.number)


@app.get("/protokoll/{protokoll_id}", response_model=Protokoll, tags=["protokoll"])
def get_protokoll(protokoll_id: UUID) -> Protokoll:
    p = store.get(protokoll_id)
    if p is None:
        raise HTTPException(404, "protokoll not found")
    return p


@app.patch("/protokoll/{protokoll_id}", response_model=Protokoll, tags=["protokoll"])
def patch_protokoll(protokoll_id: UUID, body: ProtokollPatch) -> Protokoll:
    p = store.patch_data(protokoll_id, body.data)
    if p is None:
        raise HTTPException(404, "protokoll not found")
    return p


@app.delete("/protokoll/{protokoll_id}", status_code=204, tags=["protokoll"])
def delete_protokoll(protokoll_id: UUID) -> None:
    if not store.delete(protokoll_id):
        raise HTTPException(404, "protokoll not found")
