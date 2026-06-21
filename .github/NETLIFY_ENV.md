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

## Optional — Event harvester scripts (local/CI only)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `BING_SEARCH_API_KEY` | Scripts | Bing Web Search for harvest |
| `GOOGLE_CUSTOM_SEARCH_API_KEY` | Scripts | Google Custom Search |
| `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | Scripts | Google CSE cx |

## AI Event Intelligence (optional)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `OPENAI_API_KEY` | Functions only | Advisory event scoring — never auto-publishes |
| `OPENAI_EVENT_INTELLIGENCE_MODEL` | Functions | Default `gpt-4o-mini` |

## Integrations (planned — not live)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `GOOGLE_CLIENT_ID` | Future build | Google Calendar OAuth (campaign workspace) |
| `GOOGLE_CLIENT_SECRET` | Functions only | Google Calendar token exchange |
| `MOBILIZE_API_KEY` | Functions only | Mobilize volunteer events — explicit user approval required |

> AI is **advisory only**. All public submissions and harvested candidates require admin approval.

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
psql $DATABASE_URL -f supabase/migrations/003_event_ingestion_candidates.sql
psql $DATABASE_URL -f supabase/migrations/004_intelligence_layers.sql
psql $DATABASE_URL -f supabase/migrations/005_ai_event_network.sql
psql $DATABASE_URL -f supabase/migrations/006_named_campaign_workspaces.sql
npm run seed:import
```

## Local dev (H: drive)

Copy `.env.example` → `.env.local` and fill values. Run:

```bash
cd H:/SOSWebsite/civic-call
node scripts/run-with-h-drive-env.cjs npm run dev
```

For functions locally: `npx netlify dev` (still use H: wrapper for npm).
