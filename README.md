# besiktning

B2B SaaS for Swedish besiktningsmän (building inspectors) to author **besiktningsprotokoll** online and download polished PDFs.

## Status

Pre-MVP. Active build. Plan lives in `~/.claude/plans/read-info-in-folder-especially-validated-cupcake.md`.

Milestone progress:
- [x] M1 — Repo scaffold, FastAPI hello world (in-memory storage)
- [ ] M2 — `common.json` + `apartment.json` schemas, Next.js wizard with autosave
- [ ] M3 — Photo + handwritten-scan upload with vision transcription
- [ ] M4 — Magic-link auth, signature image
- [ ] M5 — Validation endpoint + review UI
- [ ] M6 — WeasyPrint PDF render (apartment)
- [ ] M7 — `house.json` + `smahus.json` templates
- [ ] M8 — Hetzner deployment, backups, GDPR docs

## Layout

```
apps/
  api/        FastAPI + Pydantic + (Postgres later)
  web/        Next.js 14 (not scaffolded yet — needs Node 20+/pnpm)
packages/
  schemas/    JSON schemas (apartment, smahus, house) + shared common
```

## Running the API locally

Requires Python 3.11+ (3.14 works).

```powershell
cd apps/api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Then:
- http://localhost:8000/healthz
- http://localhost:8000/docs (OpenAPI)

## Running the web app

Not scaffolded yet — install Node 20+ and pnpm first, then this section will get filled in during milestone 2.
