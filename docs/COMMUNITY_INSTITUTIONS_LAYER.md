# Community Institutions Layer 1.0

County boards answer: **Who are the major institutions that shape community life here?**

Not an election dashboard — a **community operating system**.

## Model

```text
County
 ├─ Church Directory (per city)
 ├─ School Directory (governance + activities + calendar feed)
 ├─ College Directory (campus calendar sources)
 ├─ Civic Organizations (VFD, Rotary, Farm Bureau, libraries, hospitals…)
 ├─ Community Strength Indicators
 ├─ Event Source Coverage %
 └─ Sports Hub
```

## Data registries

| File | Contents |
|------|----------|
| `data/institutions/church-directory.json` | Full church schema — no guessed attendance |
| `data/institutions/school-directory.json` | School profiles + governance + harvest targets |
| `data/institutions/college-directory.json` | AR universities & community colleges |
| `data/institutions/civic-organizations.json` | Libraries, VFD, chamber, Rotary, etc. |
| `data/institutions/church-event-harvest-patterns.json` | Church Event Engine patterns |

Regenerate: `npm run generate:institutions`

## Church directory fields

Name, denomination, address, website, leadership (public only), service times, youth programs, food pantry, community meals, annual events, VBS, trunk-or-treat, fish fry, spaghetti dinner, **size_category** (`small|medium|large|mega` only when verified).

## School layer

Profile, governance (board schedule/members), activities (football, band, FFA…), calendar feed harvest targets → auto event candidates.

## Church Event Engine

Harvest queries for: fish fry, spaghetti dinner, wild game dinner, BBQ fundraiser, pancake breakfast, VBS, trunk-or-treat, community Thanksgiving/Christmas meals.

Wired into `scripts/event-harvest/lib/city-query-builder.mjs` via `church-event-queries.mjs`.

## County dashboard (candidate)

`/campaigns/:slug/county/:countySlug` shows:

- Community strength indicators
- Event source coverage bars (known / verified / %)
- Institution directories
- Sports hub

## Migration

`supabase/migrations/013_community_institutions_layer.sql`

## Privacy

Public sources only. Pastor names only when publicly listed. No guessed congregation size.
