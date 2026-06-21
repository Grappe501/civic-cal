# Pass 31 — Community Narrative Engine

Turn Arkansas Everywhere from a **calendar** into a **statewide knowledge system** optimized for both human readers and AI retrieval.

## Goal

Every high-value entity page gets structured narrative blocks:

- About
- History / origin story
- Timeline
- Interesting facts (sourced or flagged for research)
- FAQs
- Related entities (knowledge graph links)
- Source citations
- Last refreshed

## Scope (phase 1)

| Entity | Route pattern | Priority |
|--------|---------------|----------|
| Festival / fair | `/festival/:slug` | P0 |
| Event | `/event/:slug` | P0 |
| City | `/:slug` or `/city/:slug` | P1 |
| County | `/:slug-county` | P1 |
| Organization | `/organization/:slug` | P1 |
| School / church / VFD | `/school/:slug`, etc. | P2 |

## Data

- Bundle: `data/narratives/community-narratives.json`
- Types: `src/lib/narratives/narrativeTypes.ts`
- Registry: `src/lib/narratives/narrativeRegistry.ts`
- Scaffold generator: `scripts/narratives/build-narrative-scaffolds.mjs`

Run:

```bash
npm run narratives:build-scaffolds
```

Generates research-ready narrative shells for every profile missing content. Human or AI research fills blocks; only sourced facts graduate to `verified`.

## UI

- `CommunityNarrativePanel` — rendered on `ProfileShell` and public event pages
- Public event pages **hide** campaign intelligence (PO/RD, candidate opportunity) — admin/campaign routes only

## AI retrieval SEO

Pages should answer natural questions:

- What is Toad Suck Daze?
- When is the Pope County Fair?
- What festivals happen in Conway?
- What events happen in Searcy this month?

Use plain-language headings, FAQ schema where appropriate, and `ai-readable-summary` blocks.

## Not in Pass 31

- New campaign features
- Paid tiers
- Automated unsourced history generation at scale (scaffold + research queue only)

## Success metrics

- Narrative coverage % by entity type
- Average internal links per profile page
- Crawlable page count (profiles × narrative sections)
- Research queue completion rate
