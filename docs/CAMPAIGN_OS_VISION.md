# Campaign Operating System — Product Vision

The calendar is the **top-of-funnel product**. People think they're buying a calendar. What they're actually buying is a **Campaign Operating System** built around geography, events, relationships, and local intelligence.

## Geographic model

```text
State
 └─ County          ← primary intelligence object (County Rollup 2.0)
      ├─ Cities     ← feeders (top 250 priority towns)
      ├─ Events
      ├─ Organizations
      ├─ Churches
      ├─ Schools
      ├─ Community Traditions
      ├─ Influencers (institutions, not individuals)
      ├─ Media
      ├─ Vote Targets
      ├─ Volunteer Infrastructure
      └─ Candidate Activity
```

County dashboard goal: **"Everything known about this county."**

## County Rollup 2.0 (implemented)

Each county dossier rolls up:

- **Demographics** — population, growth, age, income, education, housing, race/ethnicity, employment, industry, migration
- **Political** — SOS/historical/primary/general turnout placeholders, vote targets, persuasion/turnout targets, vote deficit
- **Events** — upcoming, recurring, flagship, government, church, sports, community, festivals, volunteer (from live calendar)
- **Institutions** — churches, schools, libraries, colleges, VFD, Rotary, Lions, Kiwanis, Farm Bureau, FFA, 4-H, chambers
- **Media** — newspapers, radio, Facebook, groups, newsletters, podcasts
- **Candidate activity** — planned attendance, skips, volunteer calls (from campaign plans)
- **Opportunity analysis** — biggest opportunity/risk, missing relationships, calendar gaps, volunteer opportunities

Cities (250 feeders) enrich county dossiers; harvest events strengthen both layers.

## Pricing tiers (outcomes, not features)

| Tier | Price | Outcome |
|------|-------|---------|
| **Free** | $0 | Calendar, map, community submissions, basic dashboards |
| **Campaign** | $49–99/mo | Workspace, district filter, volunteer/event planning, presence, AI recs, Google Calendar |
| **Pro Campaign** | $199–499/mo | Vote targets, county/city intel, event dossiers, AI strategist, gap analysis, Mobilize, county reports, weekly briefings |
| **Campaign OS** | $1,000+/mo | Voter universe, contacts, volunteers, attendance, donors, endorsements, relationship mapping, field ops, AI briefing engine, county playbooks, comms planning |

## Pass 15 — Campaign OS addiction layer (implemented)

**Campaign Event Layer** — fundraisers, town halls, phone banks, canvasses, church visits, etc. Stored locally (demo) with Supabase schema in migration `014`. Conflict detector compares campaign schedule vs high-RD community events.

**Institution Relationship Engine** — tracks institutions (not people): Rotary, NAACP, Farm Bureau, VFW, chambers, churches, schools, libraries, VFD. Scores, last-attended, recommended next action.

**Event Importance Engine** — translates community events into opportunities (attendance, RD, tradition, youth, volunteer, media, candidate fit, fundraising, coalition scores).

**Morning Brief** — deterministic dashboard insights: missing counties, high-RD events, schedule conflicts, volunteer gaps, low institution relationships, opponent presence.

**Discovery** — Young Arkansas chip + expanded Live music layer on public discover home.

Routes: campaign dashboard at `/campaigns/:slug` — morning brief at top, campaign events + institution panels in sidebar.

## Pass 16 — Community Anchor Intelligence (implemented)

Extension offices, Extension Homemakers, VFDs (first-class), parades, Arkansas Food Trail, community attendance signals. County brief **Community Anchors** section with events-sourced-by-anchor metrics. See `docs/COMMUNITY_ANCHORS_LAYER.md`.

## AI roadmap (beyond scoring)

1. **Weekly campaign briefing** — Monday auto-brief: high-opportunity events, counties with no presence, recommended focus days
2. **Event intelligence expansion** — continuous "what don't we know?" research tasks (parking, accessibility, attendance, host contact, political significance)
3. **County brief generator** — one-click full county brief (demographics, math, events, orgs, media, actions)
4. **Event attendance planner** — candidate availability → optimal route, events, travel, volunteer slots
5. **Relationship network engine** — institution-level gaps (Farm Bureau vs Rotary vs VFD attendance patterns)

## Arkansas Everywhere Network

**Public side generates intelligence:**

- Calendar, events, submissions, local information

**Campaign side consumes and organizes:**

- Strategic dashboards, county intelligence, AI briefings, volunteer planning, presence, opportunity scoring

Every city added to the top-250 expansion increases the value of every county dossier, event dossier, and campaign workspace simultaneously.

## Technical notes

- Registry: `npm run generate:local-intelligence` (250 city feeders → 75 county rollups)
- Routes: `/campaigns/:slug/county/:countySlug` (County Rollup 2.0 brief)
- Privacy: aggregate geography and institutions only — never individual voter inference or micro-targeting
