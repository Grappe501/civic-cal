# Community Systems North Star

**Stop thinking about events. Start thinking about community systems.**

An event is a symptom. The institution is the asset.

## Knowledge stack (correct order)

```text
Institution
    ↓
Traditions
    ↓
Events
    ↓
People
    ↓
Community Influence
```

Arkansas Everywhere is not a calendar with profiles attached. It is a **living map of how communities function** — with the calendar as the visible surface of a deeper graph.

## Product moat

```text
Arkansas Everywhere
        ↓
Community Calendar (visible)
        ↓
Event Database
        ↓
Community Knowledge Graph (institutions + traditions + events)
        ↓
Community Influence Graph (Pass 39)
        ↓
Community DNA Layer — Census + BLS (Pass 38)
        ↓
Community Health Score (Pass 40)
        ↓
AI Brain 3.0 — gap discovery as research director
        ↓
Campaign tools (admin-only, on top)
```

## What AI should answer (public-safe)

- What institutions shape Conway County?
- What annual events draw the largest crowds?
- What organizations generate the most recurring events?
- What communities are underrepresented on the calendar?
- What counties have the strongest volunteer networks?
- What counties are underserved for public community life?

## Community DNA (not campaign targeting)

Every city page eventually knows — from **Census ACS** and **BLS QCEW / LAUS** (public, sourced):

| Layer | Fields |
|-------|--------|
| Population | total, growth rate, age breakdown |
| Economic | major employers, unemployment, labor participation, median income |
| Education | attainment, school systems, college enrollment |
| Character | rural / suburban / urban; tourism / manufacturing / agriculture / college town |

Example city dossier voice (Searcy):

> Searcy is a regional education and healthcare center serving White County and surrounding communities.
>
> **Population:** 24,000+ · **Major employers:** Unity Health, Harding University  
> **Community anchors:** Harding University · White County Fair · White County Extension · Downtown Searcy Association

See `data/community-systems/community-dna-schema.json`.

## Discovery guide pages (traffic, not thin event lists)

High-intent search landing pages — each aggregates a lane with internal links and FAQ JSON-LD:

- Arkansas Fish Fry Guide
- Arkansas Festival Guide
- Arkansas County Fair Guide
- Arkansas Christmas Parade Guide
- Arkansas Farmers Market Guide
- Arkansas Food Truck Guide
- Arkansas Concert Guide
- Things To Do This Weekend (generated weekly)
- Arkansas This Month (generated monthly)

See `data/community-systems/discovery-guide-registry.json`.

## Pass discipline (unchanged)

Every harvest pass still delivers:

1. **Density** — source-backed calendar records  
2. **Narrative depth** — institution/tradition profiles, not event blurbs  
3. **Crawlable pages** — guides, profiles, sitemap, AI indexes  

## Hard rules

- Census/BLS for **community intelligence**, not voter targeting or micro-segmentation.
- Cultural community lanes (Pass 36.5) = **public community events only**, not worship services.
- Music lane (Pass 37.5) = venue + artist + tour entities linked to dated concerts.
- No invented dates, employers, or attendance — research tasks when uncertain.

## Schema & examples

| Artifact | Path |
|----------|------|
| Influence graph schema | `data/community-systems/influence-graph-schema.json` |
| Conway County example | `data/community-systems/examples/conway-county-influence-graph.json` |
| Community DNA schema | `data/community-systems/community-dna-schema.json` |
| Health score schema | `data/community-systems/community-health-score-schema.json` |
| AI Brain 3.0 gap rules | `data/community-systems/ai-brain-3-gap-rules.json` |
| Guide page registry | `data/community-systems/discovery-guide-registry.json` |
| Revised pass sequence | `docs/PASSES_33_40_ROADMAP.md` |
