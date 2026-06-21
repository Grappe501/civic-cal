# Feed Attachment Engine (Pass 23A)

## Problem

The platform knows **institutions exist** (churches, schools, libraries) but often lacks **calendar feed URLs**. Without feeds, harvest cannot scale.

```text
Institution → Source URL → Calendar Feed → Event Stream
```

## Metrics (track daily)

| Metric | Meaning |
|--------|---------|
| Known institutions | Churches, schools, orgs, extension offices in registry |
| Feed slots | Expected county + city calendar attachment points |
| Feeds attached | Slots with a real public calendar URL |
| Coverage % | Attached ÷ slots |
| Projected event yield | Sum of expected_yield for attached (or potential) feeds |
| Verified event count | Events on public calendar today |

**Events are the output. Feeds are the asset.**

## Registries

| File | Scope |
|------|--------|
| `data/feeds/county-feed-registry.json` | 75 counties × 10 slots (government, extension, library, fair, Farm Bureau, chamber, tourism, schools, colleges, VFD) |
| `data/feeds/city-feed-registry.json` | 250 cities × 7 slots (city calendar, parks, library, chamber, downtown, tourism, community center) |
| `data/feeds/feed-attachment-report.json` | Coverage dashboard JSON |

## Commands

```bash
npm run feeds:generate   # rebuild county + city registries
npm run feeds:report     # coverage report from registries
npm run feeds:build      # both
npm run discover:sources # refresh city source templates
```

## Admin UI

- `/admin/feeds` — statewide feed attachment dashboard
- `/admin/data-health` — summary strip
- County pages — feed coverage strip (institutions, attached, missing, %)

## Yield scoring (light)

Each slot has `expected_yield` (school district ≈ 45, city calendar ≈ 35, church ≈ 4). Full yield ranking is Pass 23B.

## Next passes

- **23B** — Yield scoring engine (rank sources by expected events)
- **23C** — Top 250 city source discovery (real URLs, not templates)
- **23D–G** — School, church, extension, VFD harvest lanes
