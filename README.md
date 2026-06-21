# civic-cal / Arkansas Everywhere

Standalone public civic calendar — **firewalled** from RedDirt campaign code. Shares the same Postgres/Supabase database via the `civic_call` schema only.

**GitHub:** [github.com/Grappe501/civic-cal](https://github.com/Grappe501/civic-cal)

## H: drive rule (mandatory)

**Nothing writes to C:.** All npm cache, temp, and Vite cache are pinned to `H:\SOSWebsite\.local\`.

```bash
cd H:/SOSWebsite/civic-call
node scripts/run-with-h-drive-env.cjs npm install
npm run dev
npm run build
```

## Local dev

```bash
cd H:/SOSWebsite/civic-call
cp .env.example .env.local   # fill keys locally — never commit
npm run dev                  # http://localhost:5174
```

With Netlify Functions locally: `npx netlify dev` (after `npm install`).

## Integrated Maps Setup

### Google Cloud APIs to enable

1. **Maps JavaScript API** — browser map (`VITE_GOOGLE_MAPS_API_KEY`)
2. **Geocoding API** — server-side address lookup (`GOOGLE_MAPS_GEOCODING_API_KEY`)
3. **Places API** — optional/future (autocomplete)

### Environment variables

| Variable | Where | Notes |
|----------|-------|-------|
| `VITE_GOOGLE_MAPS_API_KEY` | Netlify **build** env | Browser only. Restrict by **HTTP referrer** (your Netlify domain + `localhost:5174`). |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | Netlify **functions** env | Server only. Restrict by **IP**. Never prefix with `VITE_`. |
| `DATABASE_URL` | Build + functions | Same Postgres as RedDirt |
| `CIVIC_CALL_ADMIN_TOKEN` | Functions | Admin Bearer token |

Full Netlify checklist: [`.github/NETLIFY_ENV.md`](.github/NETLIFY_ENV.md)

### Safety

- Two keys recommended: one referrer-locked for the browser, one IP-locked for geocoding functions.
- Geocoding never runs in the browser — only via `/.netlify/functions/geocode-event`.
- Without keys, the app degrades gracefully (list view + address links still work).

### Optional seed geocoding

```bash
GOOGLE_MAPS_GEOCODING_API_KEY=... npm run seed:geocode
# writes data/seed-events-geocoded.json (does not overwrite seed-events.json)
```

## Seed data

```bash
npm run seed:sync      # from RedDirt calendar-command-center (read-only)
npm run seed:import    # requires DATABASE_URL
```

## Database migrations

```bash
psql $DATABASE_URL -f supabase/migrations/001_civic_calendar.sql
psql $DATABASE_URL -f supabase/migrations/002_event_maps.sql
psql $DATABASE_URL -f supabase/migrations/003_event_ingestion_candidates.sql
psql $DATABASE_URL -f supabase/migrations/004_intelligence_layers.sql
psql $DATABASE_URL -f supabase/migrations/005_ai_event_network.sql
```

## AI Event Intelligence Network

**Policy:** AI is advisory only — never auto-publishes events. Community feedback and public submissions go through human review.

### OpenAI setup (optional)

Set on Netlify Functions (not `VITE_`):

```bash
OPENAI_API_KEY=...
OPENAI_EVENT_INTELLIGENCE_MODEL=gpt-4o-mini  # optional
```

Without `OPENAI_API_KEY`, scoring uses deterministic PO/RD fallback.

### New Netlify functions

| Function | Purpose |
|----------|---------|
| `ai-score-event` | Admin POST — AI/deterministic assessment |
| `event-feedback` | Public POST — local knowledge on event detail |
| `trusted-contributors` | Public POST — county ambassador signup |

### Approval queue

- All `/submit` events → `status: pending` unless trusted contributor (future)
- Spam risk scored softly — enhanced review, not hard block
- Harvester candidates → admin Event Intelligence tab only

### Campaign dashboard (demo)

- `/campaigns` — landing
- `/campaigns/demo` — localStorage workspace, district filter, plan statuses
- Google Calendar & Mobilize — disabled planning rails only

### Contributor trust

- `/help-build-the-calendar` → `trusted_contributors` table (`trust_level: new`)
- `/opportunity-engine` — scoring transparency

## Netlify deploy

Repo root **is** the app (no base directory subfolder when deploying from `Grappe501/civic-cal`).

- **Build:** `npm run build`
- **Publish:** `dist`
- **Functions:** `netlify/functions`

Set all env vars from [`.github/NETLIFY_ENV.md`](.github/NETLIFY_ENV.md).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Event feed + filters |
| `/map` | Statewide interactive map |
| `/submit` | Public submission + map preview |
| `/organizers` | Organizer intelligence + five layers |
| `/opportunity-engine` | Scoring system explainer |
| `/help-build-the-calendar` | County ambassador signup |
| `/campaigns` | Campaign dashboard landing |
| `/campaigns/demo` | Demo workspace (localStorage) |
| `/admin` | Moderation + map review + Event Intelligence + AI scoring |
| `/county/:slug` | County calendar (map/list toggle) |
| `/event/:slug` | Detail + embedded map |

## Event Intelligence Harvester

**Policy:** Public sources only — official sites, public event listings, diocese calendars, chambers, tourism boards, Eventbrite public pages, newspapers. No login bypass, no private Facebook groups, no paywalls, no robots.txt violations.

### Commands

```bash
npm run harvest:flagship              # DOLR + flagship recurring events → staged JSON
npm run harvest:city -- "Center Ridge"
npm run harvest:priority-cities       # query plan for top priority cities
npm run harvest:dedupe
npm run import:candidates             # DATABASE_URL — load staged → Postgres
```

### Optional search API keys

| Variable | Purpose |
|----------|---------|
| `BING_SEARCH_API_KEY` | Bing Web Search for harvest scripts |
| `GOOGLE_CUSTOM_SEARCH_API_KEY` | Google CSE |
| `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | Google CSE cx |

Without keys, harvest scripts output **query plans** to `data/ingestion/raw-search-results/` instead of failing.

### Review workflow

1. Harvest → `data/ingestion/staged-event-candidates.json`
2. Admin → **Event Intelligence** tab
3. Approve into live `civic_call.events` — never auto-published

### Data registries

- `data/ingestion/event-source-registry.json`
- `data/ingestion/flagship-recurring-events.json`
- `data/arkansas/top-100-priority-cities.json`

## Lane boundaries

- Do **not** import from `RedDirt/src/**`
- May **read** `RedDirt/data/calendar-command-center/**` for seed sync only
- Database: `civic_call` schema only
