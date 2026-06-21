# Pass 37 — Arkansas Weekly Recurring Life

**Goal:** Weekly recurring public-life events that compound calendar density — markets, food trucks, library/senior/parks programs, service clubs, cruise nights, bingo.

**Rule:** Recurrence pattern + source required. No invented weekly slots without host linkage. Descriptions instruct operators to confirm schedule annually.

## Sub-lanes

| Lane | Focus |
|------|-------|
| **37A** | Farmers markets |
| **37B** | Food truck circuits |
| **37C** | Library programs |
| **37D** | Senior center activities |
| **37E** | Parks & recreation |
| **37F** | Youth sports leagues |
| **37G** | Service clubs (Rotary / Lions / Kiwanis) |
| **37H** | Cruise nights / car shows |
| **37I** | Bingo / community center |

## Pipeline

```bash
npm run harvest:weekly-recurring
npm run approve:weekly-recurring
npm run audit:weekly-recurring
npm run weekly-recurring:pass37-publish   # full chain + indexes + build
```

## Data

- `data/weekly-recurring/weekly-recurring-institution-registry.json`
- `data/weekly-recurring/weekly-recurring-series-registry.json`
- `data/ingestion/weekly-recurring-staged.json`
- `data/weekly-recurring/weekly-recurring-approved-events.json`
- `data/weekly-recurring/weekly-recurring-research-tasks.json`

## App integration

- `src/lib/events/seedCatalog.ts` — bundle priority 9
- `src/lib/weekly-recurring/weeklyRecurringHealth.ts` — admin data health
- `src/lib/weekly-recurring/weeklyRecurringLanes.ts` — sub-lane labels

See `docs/PASSES_33_40_ROADMAP.md`.
