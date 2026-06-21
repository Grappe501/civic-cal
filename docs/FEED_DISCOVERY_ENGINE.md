# Feed Discovery Engine (Pass 23C)

## Goal

```text
400 feeds attached → 1,500 feeds attached
```

Before yield scoring or county deep-dives. The bottleneck is **URL attachment**, not event harvesting.

## Pipeline

```text
Institution inventory
  → Feed slot registry (23A)
  → URL pattern candidates (23C)
  → HTTP verification
  → Institution + slot registries updated
  → Attachment report
  → Harvest (23D–G)
```

## Commands

```bash
npm run feeds:discover      # generate + verify candidate URLs
npm run feeds:apply         # merge into registries
npm run feeds:discover-all  # discover + apply + report
```

Environment:

- `FEED_DISCOVER_VERIFY_LIMIT` — max URLs to verify per run (default 800)
- `FEED_DISCOVER_SLOT_LIMIT` — slot feeds to queue (default 600)
- `FEED_DISCOVER_INST_LIMIT` — institutions to queue (default 400)

## Discovery sources (per city/county)

| Category | Examples |
|----------|----------|
| Government | City calendar, parks & rec |
| Education | School district, colleges |
| Community | Library, chamber, downtown |
| Faith | Major church sites |
| Agriculture | Extension, 4-H, Farm Bureau |
| Emergency | VFD associations |
| Tourism | CVB, tourism office |

## Annual yield forecasts (advisory)

| Source | Expected events/year |
|--------|---------------------|
| School district | 70 |
| City calendar | 35 |
| Library | 24 |
| Extension | 18 |
| Church | 12 |
| VFD | 6 |

Used to prioritize **what to attach first**, not to invent events.

## AI Feed Discovery Assistant

- `src/lib/ai/feedDiscoveryAssistant.ts`
- `/.netlify/functions/ai-feed-discovery`
- Input: county + coverage gaps
- Output: highest-probability missing feeds, recommended searches, expected yield
- **Advisory only** — never auto-attaches or publishes

## Statewide KPI

Track daily:

```text
Feeds attached / 1,500 goal
```

Not raw event count. One feed = many future events.

## Next passes

- **23D** — School calendar harvest (every district, every high school)
- **23E** — Church event harvest (top congregations, county by county)

After 23C–23E, visible events should move from ~244 toward **1,500+** without new UI features.
