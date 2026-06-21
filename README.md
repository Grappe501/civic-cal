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

## District Boundary Engine (Pass 7)

Campaign dashboards classify events into **inside**, **near**, and **worth the trip** (statewide high-value exceptions).

- **Data:** `data/districts/arkansas-districts-seed.json` — congressional AR-01–04, SD-16, SD-27, statewide
- **Engine:** `src/lib/campaigns/districtBoundaryEngine.ts`
- **API:** `/.netlify/functions/districts`
- **Explorer:** `/district-engine`

```bash
psql $DATABASE_URL -f supabase/migrations/008_district_boundaries.sql
psql $DATABASE_URL -f supabase/migrations/009_candidate_presence_ai_search.sql
```

Partial counties (e.g. Pulaski in AR-02) use statutory whole-county lists until precinct GeoJSON is imported.

## Named Campaign Dashboards

Reusable campaign workspaces with personalized branding, district scope, and event planning.

| Slug | Candidate | Office |
|------|-----------|--------|
| `kelly-grappe-sos` | Kelly Grappe | Secretary of State (statewide) |
| `chris-jones-ar02` | Chris Jones | U.S. House AR-02 |
| `fred-love-governor` | Fred Love | Governor (statewide) |
| `eduardo-guzman-senate` | Eduardo Guzman | State Senate SD-27 |
| `joshua-irby-sd16` | Joshua Irby | State Senate SD-16 (Saline / Benton / Bryant) |
| `wendy-peer-house` | Wendy Peer | State House (district pending) |

## Candidate Presence Layer (Pass 9)

Campaign dashboards can mark events as attending, surrogate, or volunteer-needed — and **choose public visibility** on the live calendar.

## Volunteer Recruitment Presence Layer (Pass 17)

When a campaign marks **Need volunteers** and toggles **Advertise publicly**, the public calendar shows a volunteer-recruitment badge (icon + text, campaign-branded color).

### Public vs private rules

- Campaign plans stay **private** unless the campaign explicitly enables public visibility per event.
- Volunteer badges appear only when `advertise_volunteers=true` **and** `needs_volunteers=true`.
- Candidate-attending badges remain separate (visually distinct corner placement and icon).

### Mobilize / signup URL behavior

Click priority (outbound links only — no Mobilize API in this pass):

1. Event **Mobilize event URL**
2. Event **volunteer signup URL**
3. Campaign **default volunteer signup URL**
4. No URL → modal: “Signup link coming soon” / contact campaign

**Library:** `src/lib/integrations/mobilizeLinks.ts` · `resolveVolunteerDestination()`, `getVolunteerBadgeLabel()`

### Future Mobilize API

- Workspace `mobilize_org_url` placeholder in seed JSON
- `MOBILIZE_API_KEY` server-side only when integration is approved
- This pass links outward only; no writes to Mobilize

### Discovery

- Chip: **Campaign volunteer opportunities** — events with at least one public volunteer ask
- Map/explore **legend:** candidate attending · volunteers needed · surrogate · multiple watching

### Admin

`/admin` → **Volunteer recruitment** tab: campaigns advertising, events with asks, missing signup links.

### Migration

```bash
# After applying 016_volunteer_recruitment_presence.sql via Supabase
npm run stack:migrate   # if wired; else apply migration in Supabase dashboard
```

### Public vs private plans (Pass 9)

- Plans default to **private** (`public_presence_status: private`)
- Toggle `show_candidate_attending`, `show_surrogate_attending`, or volunteer **Advertise publicly** to display badges
- Volunteer badges use `advertise_volunteers` (Pass 17); legacy `show_volunteers_needed` maps forward
- Badges appear on homepage feed, map cards, and event detail pages

### Badge corners

| Corner | Meaning |
|--------|---------|
| Top-left | Candidate attending (campaign brand color) |
| Top-right | Volunteers needed (volunteer color) |
| Bottom-left | Surrogate planned |
| Bottom-right | Multiple campaigns watching |

**Library:** `src/lib/campaigns/presenceLayer.ts` · **UI:** `PresenceBadges.tsx`

Plans sync from **localStorage** in demo mode; DB columns on `campaign_event_plans` when migrated.

## AI Strategic Search (Pass 9)

Candidate dashboards include an **AI strategic search bar** and **Strategy Panel** — event strategist on top of the calendar.

### Features

- Natural-language queries: gaps, high-RD church events, volunteer deployment, worth-the-trip
- **Calendar gap analysis:** empty days, counties without presence, high-PO unacted events
- **Strategy Panel:** recommended next 5, gaps, RD rooms, crowd events, volunteer needs

### API

- `POST /.netlify/functions/campaign-ai-search` — logs to `campaign_ai_queries`
- **OPENAI_API_KEY** enables GPT reasoning; without it, deterministic fallback filters run

### Env vars

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Strategic search + enhanced scoring |
| `OPENAI_EVENT_INTELLIGENCE_MODEL` | Optional model (default `gpt-4o-mini`) |
| `DATABASE_URL` | Persist plans + AI query log |

Apply migration:

```bash
psql $DATABASE_URL -f supabase/migrations/009_candidate_presence_ai_search.sql
```

## Event Intelligence Dossiers (Pass 10)

Every `/event/:slug` page is a **field briefing**: logistics, candidate opportunity, sources, presence, and open research questions.

### Dossier fields

Host, contacts, sources, cost, crowd range, parking, accessibility, indoor/outdoor, food, family-friendly, history/tradition, candidate & volunteer guidance, local customs, arrival advice, event format, confirmed facts vs likely inferences, unanswered questions.

### Source policy (legal public research only)

Allowed: official event sites, city/county calendars, church/parish pages, **public** Facebook pages, chamber/tourism, school pages, newspapers, Eventbrite/public tickets, library calendars, fair/festival official sites.

**Not allowed:** private groups, login scraping, paywall bypass, platform protection circumvention.

### AI research policy

- `POST /.netlify/functions/event-dossier-research` — admin only
- **OPENAI_API_KEY:** structured dossier + research tasks from event data + community feedback
- **Never invents facts** — separates confirmed, inferred, and unanswered
- Without OpenAI: deterministic blank dossier + standard research checklist

### Admin review

`/admin` → **Event Dossiers** tab: missing, needs research, low confidence, run AI research, mark verified.

### Local feedback

Expanded form on event detail — accessibility, parking, cost, vendors, crowd, format, host, candidate tips. Goes to `event_feedback` review queue, not direct publish.

### Migration

```bash
psql $DATABASE_URL -f supabase/migrations/010_event_intelligence_dossiers.sql
```

- **Data:** `data/campaigns/initial-campaign-workspaces.json` + migration `006_named_campaign_workspaces.sql`
- **API:** `/.netlify/functions/campaign-workspaces` (seed JSON fallback)
- **Plans:** localStorage per slug until auth/DB sync
- **District boundaries:** placeholder counties for congressional/senate — GIS pass next
- **Google Calendar / Mobilize:** planned, disabled — no live sync without explicit campaign authorization

```bash
psql $DATABASE_URL -f supabase/migrations/006_named_campaign_workspaces.sql
```

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
| `/district-engine` | Boundary engine explainer |
| `/campaigns` | Campaign selector + named dashboards |
| `/campaigns/:slug` | Branded campaign command center |
| `/campaigns/demo` | Generic sandbox dashboard |
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
- `data/arkansas/top-100-priority-cities.json` (legacy 40-city seed)
- `data/arkansas/top-200-priority-cities.json` (Pass 8 — 200 cities with expanded queries)

## Top 200 Statewide Harvest (Pass 8)

Harvest public events across Arkansas's 200 largest cities/towns through **November 1, 2026**. All candidates land in review — **never auto-published**.

### Harvest horizon

| Variable | Default | Purpose |
|----------|---------|---------|
| `EVENT_HARVEST_START_DATE` | `2026-06-20` | Earliest event date to stage |
| `EVENT_HARVEST_END_DATE` | `2026-11-01` | Latest event date to stage |
| `HARVEST_BATCH_ID` | `top200-2026-11` | Batch tag on staged candidates |

### Commands

```bash
npm run generate:top200-cities   # rebuild top-200 registry JSON
npm run discover:sources         # city/county/chamber/library source templates
npm run harvest:top200           # search + stage (query plan if no API keys)
npm run harvest:november         # same pipeline, horizon defaults through Nov 1
```

### Output files

- `data/ingestion/discovered-sources/top-200-city-sources.json`
- `data/ingestion/staged-event-candidates-top-200.json`
- `data/ingestion/harvest-summary-top-200.json`

### Optional API keys

| Variable | Purpose |
|----------|---------|
| `BING_SEARCH_API_KEY` | Automated web search during harvest |
| `GOOGLE_CUSTOM_SEARCH_API_KEY` + `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | Google CSE alternative |
| `OPENAI_API_KEY` | Admin-only AI scoring (advisory, never auto-publish) |

Without search keys, scripts write **query plans** and source templates — the pass does not fail.

### Review queue policy

1. Harvest → staged JSON with `review_status: needs_review`
2. Admin **Event Intelligence** → filters by city, county, batch, PO/RD, category
3. Batch approve/reject — human gate before live calendar
4. AI scores are advisory overlays only

### Styling audit (Pass 8)

- Global tokens in `src/index.css` — stronger contrast, card elevation, chip variants
- `.chip-active`, `.chip-muted`, `.card-elevated`, `.text-muted`, `.page-header`
- Key pages: home, map, organizers, opportunity-engine, help-build-the-calendar, campaigns, admin, submit, event detail

### Candidate branding (Pass 8)

Per-slug profiles in `src/lib/campaigns/brandingProfile.ts`:

- Stronger hero + scope card + priority lane + "where your campaign should be"
- Kelly Grappe SOS — statewide command / election integrity
- Chris Jones AR-02 — inside / near / worth the trip
- Fred Love Governor — all-Arkansas movement map
- Eduardo Guzman Senate — Fort Smith / River Valley density

## Lane boundaries

- Do **not** import from `RedDirt/src/**`
- May **read** `RedDirt/data/calendar-command-center/**` for seed sync only
- Database: `civic_call` schema only

## Candidate local intelligence dossiers (Pass 11)

Candidate-only city/county intelligence briefs — **not public-facing**. Aggregate geography only; no individual voter targeting.

### Routes

| Route | Purpose |
|-------|---------|
| `/campaigns/:slug/city/:citySlug` | City intelligence brief |
| `/campaigns/:slug/county/:countySlug` | County intelligence brief |

### Data registry

- `data/local-intelligence/top-city-dossiers.json` — top 100 cities (schema supports expansion to 250)
- `data/local-intelligence/county-dossiers.json` — county playbooks
- `data/local-intelligence/sos-election-targets.json` — SOS baseline/target vote math

Regenerate: `npm run generate:local-intelligence`

### Migration

```bash
# Apply via Supabase CLI or project migration workflow
supabase/migrations/011_city_county_campaign_intelligence.sql
```

Tables: `city_intelligence_dossiers`, `county_intelligence_dossiers`, `campaign_local_notes`, `campaign_vote_targets`

### Data source policy

- Census ACS / BLS hooks are **placeholder** in generated JSON until full import pass
- SOS target numbers use estimated baseline math — label confidence on every brief
- Campaign-entered notes stored in localStorage (demo) until DB sync to `campaign_local_notes`
- AI summarizer (`local-intelligence-ai` Netlify function): aggregate public data only; never infer individual voter preferences

### County Rollup 2.0 (Pass 12)

County is the **primary intelligence object**; up to **250 city feeders** roll up into county dossiers.

- Model: `State → County → Cities/Events/Institutions`
- Generator: `npm run generate:local-intelligence` (250 feeders → 75 county rollups)
- Route: `/campaigns/:slug/county/:countySlug` — full county brief with opportunity analysis
- Vision & tiers: [`docs/CAMPAIGN_OS_VISION.md`](docs/CAMPAIGN_OS_VISION.md)

## Discovery Layer 1.0 (Pass 13)

Public discovery — personality modes, AI hero, giant chips, Explore map, Event Safari, Race Circuit.

| Route | Experience |
|-------|------------|
| `/` | Discover home — "Arkansas is alive" |
| `/explore` | Explore Arkansas + candidate presence on map |
| `/safari` | Event Safari wizard |
| `/races` | Arkansas Race Circuit (5K through triathlon) |

Personality modes shift the whole UI: citizen, candidate, organizer, volunteer seeker.
AI hero: **Ask Arkansas Everywhere…** with example prompts per mode.

## Community Institutions Layer 1.0 (Pass 14)

County as **community operating system** — not just events.

- Registries: `data/institutions/` (churches, schools, colleges, civic orgs)
- Generator: `npm run generate:institutions` (250 cities → ~300 churches, 250 schools, 18 colleges, 880 orgs scaffolds)
- County brief: community strength, coverage %, institution directories, sports hub
- Church Event Engine wired into harvest query builder
- Docs: [`docs/COMMUNITY_INSTITUTIONS_LAYER.md`](docs/COMMUNITY_INSTITUTIONS_LAYER.md)
- Migration: `supabase/migrations/013_community_institutions_layer.sql`
