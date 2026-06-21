# civic-call (Arkansas Everywhere)

Standalone public civic calendar — **firewalled** from RedDirt campaign code. Shares the same Postgres/Supabase database via the `civic_call` schema only.

## H: drive rule (mandatory)

**Nothing writes to C:.** All npm cache, temp, and Vite cache are pinned to `H:\SOSWebsite\.local\`.

Always use wrapped scripts:

```bash
cd H:/SOSWebsite/civic-call
node scripts/run-with-h-drive-env.cjs npm install
npm run dev
npm run build
```

`.npmrc` sets `cache=H:/SOSWebsite/.local/npm-cache`. `preinstall` runs `assert-h-drive.cjs`.

## Seed data from election-plan / calendar-command-center

Read-only sync from `../RedDirt/data/calendar-command-center/` (no RedDirt code imports):

```bash
npm run seed:sync
npm run seed:import   # requires DATABASE_URL
```

## Environment (Netlify)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` or `NETLIFY_DATABASE_URL` | Same Postgres as RedDirt |
| `CIVIC_CALL_ADMIN_TOKEN` | Bearer token for `/admin` API |

Apply schema once:

```bash
psql $DATABASE_URL -f supabase/migrations/001_civic_calendar.sql
```

## Netlify deploy

- **Base directory:** `civic-call`
- **Build command:** `npm run build`
- **Publish:** `dist`
- **Functions:** `netlify/functions`

## MVP features

- Public event feed with filters (county, city, category, keyword, civic/family/free/featured)
- Submit form → pending review
- Admin approve/reject/feature
- County shareable pages (`/county/faulkner`)
- This Week + Civic Watch views
- ICS download + share links
- Community pulse + empty county alerts

## Lane boundaries

- Do **not** import from `RedDirt/src/**`
- May **read** `RedDirt/data/calendar-command-center/**` for seed sync only
- Database: `civic_call` schema only — never campaign tables from this app
