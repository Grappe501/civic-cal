# Pass 38 — Community DNA

**Goal:** Rich city/county knowledge from Census + BLS scaffolds, institution/tradition/economy layers, community personality, Calendar DNA scores, and discovery guide pages.

## Layers

| Layer | Content |
|-------|---------|
| **People** | population, age, education, income, unemployment |
| **Institutions** | schools, churches, libraries, Extension, VFDs, service clubs |
| **Traditions** | fairs, festivals, food events, recurring community life |
| **Economy** | employers, BLS sectors, labor force |
| **Personality** | agriculture-centered, college town, tourism, manufacturing, etc. |

## Pipeline

```bash
npm run community-dna:build
npm run community-dna:audit
npm run pass38:publish
```

## Data

- `data/community-dna/city-community-dna.json` (250 cities)
- `data/community-dna/county-community-dna.json` (75 counties)
- `data/community-dna/county-calendar-dna-scores.json`
- `data/community-systems/discovery-guide-registry.json`

## Routes

- `/guides/:slug` — discovery guide pages
- `/admin/community-dna` — Calendar DNA dashboard

## Public UI

- `CommunityDnaPanel` on city and county public pages
- Calendar DNA score on county headers

See `data/community-systems/community-dna-schema.json`.
