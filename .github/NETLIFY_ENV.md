# Netlify environment variables for civic-cal

Configure these in **Netlify → Site settings → Environment variables** for the site linked to [Grappe501/civic-cal](https://github.com/Grappe501/civic-cal).

## Required for production

| Variable | Scope | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Builds, Functions | Same Postgres/Neon as RedDirt — `civic_call` schema |
| `CIVIC_CALL_ADMIN_TOKEN` | Functions only | Bearer token for `/admin` API (`Authorization: Bearer …`) |

## Maps (integrated maps layer)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | Build | Browser Maps JavaScript API — **restrict by HTTP referrer** |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | Functions only | Server geocoding — **restrict by IP** (Netlify function egress) |

> **Never** put `GOOGLE_MAPS_GEOCODING_API_KEY` in a `VITE_` variable.

## Optional

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NETLIFY_DATABASE_URL` | Build/Functions | Neon Netlify integration alias — auto-mapped to `DATABASE_URL` in some setups |
| `VITE_USE_SEED` | Build | `true` for CI/demo builds without database |

## GitHub Actions mirror (optional)

If you store secrets in **GitHub → Settings → Secrets and variables → Actions**, use the same names so a future deploy workflow can pass them to Netlify CLI:

- `DATABASE_URL`
- `CIVIC_CALL_ADMIN_TOKEN`
- `VITE_GOOGLE_MAPS_API_KEY`
- `GOOGLE_MAPS_GEOCODING_API_KEY`

CI in this repo runs **without** secrets (`VITE_USE_SEED=true`) — see `.github/workflows/ci.yml`.

## Apply database migrations (manual once)

```bash
psql $DATABASE_URL -f supabase/migrations/001_civic_calendar.sql
psql $DATABASE_URL -f supabase/migrations/002_event_maps.sql
npm run seed:import
```

## Local dev (H: drive)

Copy `.env.example` → `.env.local` and fill values. Run:

```bash
cd H:/SOSWebsite/civic-call
node scripts/run-with-h-drive-env.cjs npm run dev
```

For functions locally: `npx netlify dev` (still use H: wrapper for npm).
