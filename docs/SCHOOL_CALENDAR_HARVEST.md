# Pass 27 — School Calendar Harvest

Turn **328 high schools + 18 colleges** from ADE/registry profiles into staged and approved public events.

## Funnel metric

```text
328 high schools discovered
→ calendar URL attached
→ athletics URL attached
→ staged school events
→ approved public events
```

Track live counts at `/admin/school-calendars` and in `data/schools/school-harvest-health.json`.

## Event lanes

| Lane | Examples |
|------|----------|
| School board | Board meetings, public comment nights |
| Football / Basketball | Athletic schedules |
| Band concerts | Marching band, concert performances |
| Homecoming / Senior night | Seasonal school traditions |
| Graduation | Commencement, baccalaureate |
| Theater / PTO | Plays, booster fundraisers |
| College athletics | Razorbacks, Trojans, Red Wolves schedules |
| College public | Campus lectures, career fairs |

## Commands (run from `civic-call/`)

```bash
npm run schools:discover          # ADE locator → school-harvest-registry.json
npm run schools:attach-urls       # district/college URL attachment + health JSON
npm run schools:harvest-calendars # fetch calendars → school-events-staged.json
npm run schools:approve-events -- --all-parsed   # dated parsed events → approved bundle
npm run schools:build             # attach-urls + harvest-calendars
```

### Environment knobs

| Variable | Default | Purpose |
|----------|---------|---------|
| `SCHOOL_URL_VERIFY_LIMIT` | 120 | Max district URL pattern verifications per attach pass |
| `SCHOOL_HARVEST_FETCH_LIMIT` | 50 | Max unique calendar/athletics pages fetched per harvest |
| `SCHOOL_HARVEST_DELAY_MS` | 300 | Delay between fetches |

## Data files

| Path | Role |
|------|------|
| `data/schools/school-harvest-registry.json` | 328 HS + 18 colleges with URL hooks |
| `data/schools/known-district-urls.json` | Curated Arkansas district URLs |
| `data/schools/school-harvest-health.json` | Funnel metrics |
| `data/ingestion/school-events-staged.json` | Review queue |
| `data/ingestion/school-events-approved-events.json` | Merged into seed catalog when approved |

## Approval path

- Parsed events **with dates** and `confidence_score ≥ 50` from `school_district_public_page` sources can be bulk-approved via `schools:approve-events --all-parsed`.
- Lane projections (no date) stay in staged review — not auto-published.
- Approved events merge through `seedCatalog.ts` like party meetings.

## Ops note

Set `CANDIDATE_DASHBOARD_BETA_PASSWORD` in **Netlify environment** before relying on protected candidate dashboards. Documented in `.env.example`; never commit the value.

## Related passes

- Pass 26 — School discover + harvest foundation
- Pass 23C — Feed URL discovery (county school district slots)
- Pass 25 — Civic political infrastructure (separate lane)
