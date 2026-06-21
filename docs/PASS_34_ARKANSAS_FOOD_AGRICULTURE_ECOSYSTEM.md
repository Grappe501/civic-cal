# Pass 34 — Arkansas Food & Agriculture Ecosystem

Pass 34 expands from “Extension offices only” to the full **Arkansas Food & Agriculture Ecosystem** — one of the strongest content moats in the state. This layer feeds county fairs, festivals, schools, volunteerism, rural leadership, food traditions, and outdoor culture.

**Public calendar DNA:** Arkansas Community Calendar — not Campaign Intelligence Dashboard. Campaign scoring stays admin-only.

## Model

```text
County
 ├─ 34A Extension Network
 ├─ 34B 4-H Network
 ├─ 34C FFA Network
 ├─ 34D Farm Bureau Network
 ├─ 34E Arkansas Food Trail (traditions → events)
 ├─ 34F Agricultural Businesses (community intelligence)
 └─ 34G Hunting & Outdoor Culture
        ↓
   Institution → Tradition → Events → Community
        ↓
   Public calendar density + crawlable profiles
```

## Sub-lanes

### 34A — Extension Network

Every county:

- Extension Office (UAEX)
- Agents & staff (public listings)
- Programs
- Calendar
- Publications
- Workshops

**Source:** `https://www.uaex.uada.edu/counties/{county}/`

### 34B — 4-H Network

Every county:

- Clubs
- Leaders
- Livestock programs
- Competitions
- Camps
- Fairs (links to Pass 33 county fair institutions)

### 34C — FFA Network

Every school with a chapter:

- Chapter profile
- Advisors (public)
- Competitions
- Livestock programs
- Events

### 34D — Farm Bureau Network

Every county:

- Leadership (public)
- Meetings
- Youth programs
- Women's committees
- Events

### 34E — Arkansas Food Trail

Build profiles for recurring food traditions and festivals:

| Tradition type | Examples |
|----------------|----------|
| BBQ festivals | |
| Fish fries | |
| Spaghetti suppers | |
| Wild game dinners | |
| Bean suppers | |
| Catfish festivals | |
| Crawfish festivals | |
| Watermelon festivals | |
| Tomato festivals | |
| Peach festivals | |
| Strawberry festivals | |

**Chain:**

```text
Food Event → Food Tradition → Community → County
```

Food trail events tie to churches (Pass 36), VFDs (Pass 35), and county fairs (Pass 33) where source-backed.

### 34F — Agricultural Businesses

Not for commerce — for **community intelligence**. Every county page should eventually know:

- Farmers markets
- Feed stores
- Co-ops
- Livestock auctions / sale barns
- Equipment dealers
- Seed suppliers
- Farm stores

These are community gathering places, not product listings.

### 34G — Arkansas Hunting & Outdoor Culture

Not just seasons — the **culture**:

- Ducks Unlimited chapters
- NWTF chapters
- Quail Forever
- Delta Waterfowl
- Wildlife banquets
- Outdoor expos
- Deer classic events
- Fishing tournaments
- Bass clubs
- Crappie tournaments
- Archery shoots

## Density targets

```text
75 counties × 10+ ecosystem institutions ≈ 750+ institutional profiles
+ 34E food tradition profiles (statewide, county-linked)
+ 34F gathering-place profiles (per county)
+ 34G outdoor org profiles (statewide + county chapters)
+ 2,000+ annual recurring source-backed events
```

## Tie-in to Pass 33 county fairs

Every county fair institution profile links to:

- County Extension office (34A)
- 4-H / FFA livestock paths (34B, 34C)
- Farm Bureau chapter (34D)
- Food trail traditions at the fairgrounds (34E)
- Sale barn / livestock auction where public (34F)
- Outdoor org banquets and expos near fair season (34G)

## Institution Missing Report (density engine)

Per county, compare **expected institutions** vs **indexed profiles** so AI Brain 3.0 can prioritize harvest:

```text
Faulkner County

Schools: 23    Profiles: 23
Churches: 78   Profiles: 12
VFDs: 15       Profiles: 3
Extension: 1   Profiles: 1
Farm Bureau: 1 Profiles: 0

Biggest density opportunity: Farm Bureau — Missing: 100%
```

**Schema:** `data/community-systems/institution-missing-report-schema.json`

## Community Calendar DNA Score (pre–Pass 39)

Every county gets dimensional density scores that feed Pass 40 Community Health Score:

| Dimension | Meaning |
|-----------|---------|
| Event density | How many source-backed public events? |
| Institution density | How many organizations indexed? |
| Tradition density | How many recurring traditions (food trail, fairs, fish fries)? |
| Cultural density | How many cultural community profiles? |
| Youth density | 4-H, FFA, school, scout coverage |
| Volunteer density | VFD, service, fundraiser events |
| Outdoor density | Hunting, fishing, parks, outdoor org events |
| Agricultural density | Extension, Farm Bureau, markets, ag businesses |

**Schema:** `data/community-systems/community-calendar-dna-score-schema.json`

## Harvest sources (public only)

- UAEX county pages
- 4-H / FFA public chapter pages
- Farm Bureau county pages
- FairEntry / fair livestock schedules
- Farmers market & agritourism directories (listing only)
- DU / NWTF / Quail Forever chapter finders
- Tournament calendars, outdoor expo listings
- Church/VFD public fundraiser pages (cross-lane links, no duplicate worship)

**Rule:** Source-backed → public calendar. Uncertain → research task. No invented dates.

## Pipeline

```bash
npm run ag-food-ecosystem:pass34-publish
```

Artifacts:

- `data/institutions/food-agriculture-ecosystem-registry.json`
- `data/institutions/county-food-ag-profiles.json`
- `data/institutions/food-trail-tradition-profiles.json`
- `data/institutions/outdoor-culture-profiles.json`
- `data/ingestion/ag-food-ecosystem-approved-events.json`
- `data/community-systems/county-institution-missing-reports.json` (rollup)

## Pass discipline

Every pass: **density · narrative depth · crawlable pages** — same as Pass 32–33.

See `docs/COMMUNITY_SYSTEMS_NORTH_STAR.md`, `docs/PASSES_33_40_ROADMAP.md`, `data/community-systems/food-agriculture-ecosystem-schema.json`.
