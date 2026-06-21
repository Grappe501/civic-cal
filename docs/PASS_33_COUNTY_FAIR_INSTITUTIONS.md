# Pass 33 — County Fair Institution Completion

**Model:** `institution → tradition → event stream` (not date scraping alone).

## Commands

```bash
cd H:/SOSWebsite/civic-call
npm run county-fairs:pass33-publish
```

Or step-by-step:

```bash
npm run harvest:county-fairs
npm run approve:county-fairs
npm run county-fairs:enrich-institutions
npm run audit:county-fairs
npm run narratives:build-scaffolds
npm run ai:build-indexes
npm run ai:research-tasks
npm run generate:sitemap
```

## Artifacts

| File | Role |
|------|------|
| `data/fairs/arkansas-county-fair-registry.json` | 75 county fair lane records |
| `data/fairs/county-fair-institution-profiles.json` | Institution + tradition + event stream |
| `data/ingestion/county-fair-approved-events.json` | Public calendar (auto-approved, source-backed) |
| `data/ingestion/county-fair-research-tasks.json` | Counties missing verified 2026 dates |

## Public routes

- `/festivals` — fair/festival directory
- `/festival/pope-county-fair` — institution/tradition profile
- `/event/pope-county-fair-2026-09-15-pope-fair` — dated calendar event
- `/guides/arkansas-county-fair-guide` — discovery guide (sitemap)

## Research order (45 missing counties)

Official fair site → FairEntry → Extension/4-H → chamber/CVB → fairgrounds → public Facebook → news → fair book PDF → Cofairs.

See `scripts/event-harvest/fairs/lib/county-fair-base.mjs` → `fairSearchPatterns()`.
