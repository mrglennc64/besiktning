# Setting up Neon Postgres (free EU tier)

This swaps the API from the in-memory store to a real Postgres database.
Takes about 5 minutes. No credit card required.

## Steps

1. **Sign up** at https://neon.tech using your GitHub account.

2. **Create a project**:
   - Name: `besiktning`
   - Region: **Europe (Frankfurt)** or **Europe (Stockholm)**
     — must be EU for GDPR. The free tier (~0.5 GB) is plenty for the MVP.
   - Postgres version: default (currently 17)

3. **Copy the connection string** from the dashboard. It looks like:
   ```
   postgresql://owner:passw0rd@ep-cool-name-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

4. **Convert for SQLAlchemy async**:
   - Replace `postgresql://` with `postgresql+asyncpg://`
   - Replace `?sslmode=require` with `?ssl=require` (asyncpg uses `ssl`, not `sslmode`)

   Result:
   ```
   postgresql+asyncpg://owner:passw0rd@ep-cool-name-12345.eu-central-1.aws.neon.tech/neondb?ssl=require
   ```

5. **Create `apps/api/.env`** (copy from `.env.example`):
   ```
   DATABASE_URL=postgresql+asyncpg://owner:passw0rd@ep-cool-name-12345.eu-central-1.aws.neon.tech/neondb?ssl=require
   ```

6. **Restart the API**. The first start will auto-create the tables
   (`users`, `protokoll`, `attachments`). Check the health endpoint:
   ```powershell
   Invoke-RestMethod http://127.0.0.1:8000/healthz
   ```
   Should return `{"status":"ok","storage":"PostgresStore"}`.

## What changes vs. in-memory

- Protokoll persist across API restarts.
- `data` is stored as `JSONB`, so we can later query inside it
  (e.g. "all protokoll where any finding has FK > 17%").
- Unique constraint on `(user_id, number)` prevents duplicate protokoll numbers.
- Cascading delete: removing a protokoll removes its attachments.

## What still uses the dev path

- No migrations yet — startup runs `Base.metadata.create_all()`.
  Alembic + proper migrations land in **M4** (when magic-link auth
  brings the first real schema change).
- No connection pooling tuning — the asyncpg defaults are fine for one
  inspector. Production will tune `pool_size` / `max_overflow`.

## Cost ceiling

Neon's free tier: 0.5 GB storage, autosuspend when idle.
The MVP fits comfortably. When you ship to paying customers and need
always-on + larger storage, the Launch plan is $19/mo. At 250 SEK/user
that's covered by your first paying inspector.
