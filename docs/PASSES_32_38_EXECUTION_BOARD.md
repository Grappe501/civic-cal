# Passes 32–38 — Execution Board

Every pass from 32 through 38 must deliver **three outcomes**:

1. **Add density** — more source-backed events on the public calendar  
2. **Add narrative depth** — About, History, FAQs, related links on profiles  
3. **Add crawlable/searchable pages** — internal links, sitemap, AI indexes, research tasks  

## North-star metrics (by Pass 38)

| Metric | Now | Target |
|--------|-----|--------|
| Public visible events | ~600 | **3,000+** |
| Profile/n narrative pages | ~1,300 | **10,000+** |
| County fair dates verified | 30 | **75** |
| Festival/city events | ~31 | **500+** |
| Community anchor profiles | thin | **thousands** |

---

## Pass 32 — Festival Density Explosion

**Goal:** 31 → 500+ statewide festival/city identity events.

**Search patterns:** `[city] festival`, `summerfest`, `fall festival`, `Christmas parade`, `Founders Day`, `homecoming`, `heritage day`, `jubilee`, `rodeo`, `fairgrounds`, `downtown events`, `chamber events`, `food truck Friday`, `concert in the park`, `farmers market`, `watermelon/tomato/peach/crawfish`, `chili/BBQ cookoff`, `music festival` — all 250 cities.

**Pipeline:** `npm run festival:pass32-publish`

- Source-backed → public calendar immediately  
- Uncertain → `data/ingestion/pass32-festival-research-queue.json` + AI research tasks  
- Each approved event → narrative scaffold  
- Rebuild AI indexes · push main  

---

## Pass 33 — County Fair Completion

**Goal:** 30 → 75 verified county fair date ranges.

**Sources beyond fair websites:** Extension, 4-H, FairEntry, chamber, tourism, news calendars, public Facebook, fair books PDFs, livestock/rodeo/pageant pages.

**Each county:** fair profile, date range, venue, schedule links, livestock/4-H links, narrative section, source confidence.

---

## Pass 34 — Extension / 4-H / Homemakers

**Goal:** Rural Arkansas gold — every county gets Extension, 4-H, Homemakers profiles + meeting/workshop/livestock calendars.

---

## Pass 35 — Volunteer Fire Department Network

**Goal:** Every VFD = community anchor profile + fish fries, breakfasts, BBQs, fundraisers, open houses.

---

## Pass 36 — Faith Community Ecosystem

**Goal:** Not worship times — community meals, family events, outreach, networks, faith+civic rooms (lanes 36A–36E).

**Institution lens:** Church profile + **Community Influence Score** — does this institution produce community activity? (public-safe summary; admin detail).

See `docs/PASS_36_FAITH_COMMUNITY_ECOSYSTEM.md`.

---

## Pass 37 — Arkansas Weekly Recurring Life

**Goal:** Weekly recurring density — markets, food trucks, library/senior/parks programs, service clubs (Rotary/Lions/Kiwanis), sports leagues, cruise nights, bingo, etc.

---

## Pass 38 — Community DNA

**Goal:** City/county dossiers with People · Institutions · Traditions · Economy · Community personality (Census + BLS + sourced AI narrative) + guide pages + FAQ JSON-LD at scale.

---

## Pass sequence

```text
Pass 31 → Push (narrative engine) ✅
Pass 32 → Festival density 31 → 500+
Pass 33 → County fairs 30 → 75
Pass 34 → Extension / 4-H / Homemakers
Pass 35 → VFD network
Pass 36 → Faith Community Ecosystem (36A–36E)
Pass 37 → Arkansas Weekly Recurring Life
Pass 38 → Community DNA at scale
```

See also: `docs/PRODUCT_PRIORITY_RESET.md`, `docs/PASSES_33_40_ROADMAP.md`, `docs/COMMUNITY_SYSTEMS_NORTH_STAR.md`, `data/event-lanes/master-calendar-lane-map.json`.
