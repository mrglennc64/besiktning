# Deploying the web app to Vercel

The Next.js app lives in `apps/web` (it is **not** at the repo root), and it is a
standalone pnpm project (its own `pnpm-lock.yaml`). There is no `pnpm-workspace.yaml`,
so Vercel treats `apps/web` as an ordinary Next.js app once you point it at the right
directory.

You do **not** rename `app/page.tsx`. In the App Router, `app/page.tsx` *is* the index
route (`/`) — Vercel serves it at your domain root automatically. There is no `index.tsx`.

## Dashboard settings (one-time)

In the Vercel project (New Project → import `github.com/mrglennc64/besiktning`):

| Setting | Value |
|---|---|
| **Root Directory** | `apps/web`  ← the critical one |
| Framework Preset | Next.js (auto-detected once Root Directory is set) |
| Install Command | default (`pnpm install`, auto-detected from the lockfile) |
| Build Command | default (`next build`) |
| Output Directory | default (`.next`) |

## Environment variables

Add under Project → Settings → Environment Variables (Production + Preview):

| Var | Needed for | Notes |
|---|---|---|
| `GEMINI_API_KEY` | the `/engine` photo matching | Google AI Studio key. Without it `/engine` throws. The landing page does NOT need it. |
| `NEXT_PUBLIC_API_URL` | calls to the FastAPI backend | Only set once the FastAPI service is deployed somewhere public. Defaults to `http://127.0.0.1:8000`, which won't exist in prod. The landing page does NOT need it. |

## Known blocker for `/engine` (not the landing page)

`lib/noteringar.ts` reads the catalog at request time from
`process.cwd()/../../packages/schemas/noteringar.json` — a path **outside** `apps/web`.
Vercel's serverless functions don't have that file, so the photo-matching API will 500
in production even though it works locally.

**The landing page is unaffected** (it's statically generated). Fix the catalog loading
before relying on `/engine` in production — recommended: bundle the catalog into the app
via a static `import` (so Next's file tracing includes it) instead of an `fs` read from
outside the app directory.
