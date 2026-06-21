# Passes 33–40 — Community Systems Roadmap

Revised after Pass 32. **Institutions first, events second.**

Every pass delivers: **density · narrative depth · crawlable/searchable pages**.

---

## Pass 33 — County Fair Completion

**Goal:** 30 → 75 verified county fair date ranges.

**Institution lens:** Each fair is a county anchor institution, not a one-off event.

**Sources:** Extension, 4-H, FairEntry, chamber, tourism, news calendars, public Facebook, fair books PDFs, livestock/rodeo/pageant pages.

**Outputs:** fair profile · date range · venue · schedule links · livestock/4-H links · narrative · source confidence.

---

## Pass 34 — Extension / 4-H / Homemakers

**Goal:** Every county — Extension office profile, 4-H profile, Homemakers profile, linked calendars.

**Why:** Rural relationship network; often higher civic value than generic festivals.

---

## Pass 35 — Volunteer Fire Department Network

**Goal:** Every VFD = community anchor profile + fish fries, breakfasts, BBQs, fundraisers, open houses.

---

## Pass 36 — Church Community Events

**Goal:** Public community events only (fish fries, spaghetti, wild game, trunk-or-treat, VBS family nights, fall festivals).

**Institution lens:** Church as community profile — denomination, public outreach, annual traditions.

---

## Pass 36.5 — Cultural Community Layer

**Goal:** Major Arkansas cultural communities on the calendar and in the influence graph.

| Community | Examples |
|-----------|----------|
| LGBTQ+ | Pride festivals, celebrations, community orgs |
| Hispanic | Heritage celebrations, cultural festivals, orgs, soccer tournaments |
| Marshallese | Springdale / NWA — cultural celebrations, public gatherings |
| Muslim | Eid, Ramadan community events, Islamic center public events |
| Asian | Lunar New Year, cultural festivals, university orgs |
| Black | Juneteenth, NAACP, Black Chamber, caucus public events |

**Rule:** Public community events only. Source-backed. Uncertain → research task.

---

## Pass 37 — Farmers Markets / Food Trucks / Weekly Recurring

**Goal:** Weekly recurring public-life events — markets, food truck nights, art walks, third Thursday, first Friday, concert series.

**Traffic:** High search volume for regular local life.

---

## Pass 37.5 — Music / Concert Intelligence

**Goal:** Concerts as first-class entities — Artist · Venue · Event · City · Tour.

**Venue harvest:** Walmart AMP, Simmons Bank Arena, Robinson Center, First Security Amphitheater, TempleLive, Revolution Music Room, George's Majestic Lounge, JJ's Live, and successors.

**Pages:** Artist profiles (bio, genre, official site, AR appearances) · Venue profiles (capacity, parking, history, calendar).

**SEO targets:** `Morgan Wallen Arkansas`, `concerts in Arkansas this weekend`, venue-specific queries.

---

## Pass 38 — Narrative Enrichment + Community DNA

**Goal:** Rich knowledge pages + Census/BLS community intelligence on city/county dossiers.

**Narrative sections:** About, History, Why it matters, Directions, Parking, Cost, Vendors, Volunteer, FAQs, related entities, FAQ JSON-LD.

**Community DNA:** Population, growth, age, employers, unemployment, education, rural/suburban/urban character (Census ACS + BLS — public sources only).

**Guide pages (launch):** Festival guide · County fair guide · Fish fry guide · Farmers market guide · Concert guide · This weekend · This month.

---

## Pass 39 — Community Influence Graph

**Goal:** Statewide graph — every city, county, church, school, chamber, VFD, extension office, library, college, nonprofit, festival, and recurring tradition linked.

**Example (Conway County):**

```text
Conway County
 ├─ Extension Office
 ├─ 4-H
 ├─ Homemakers
 ├─ Catholic Point Spaghetti Supper (tradition)
 ├─ Morrilton Chamber
 ├─ Sacred Heart School
 ├─ Petit Jean State Park
 ├─ VFD Network
 └─ County Fair
```

**AI queries enabled:** institution shape · crowd draw · recurring event generators · underrepresentation · volunteer network strength.

**Schema:** `data/community-systems/influence-graph-schema.json`

---

## Pass 40 — Community Health Score

**Goal:** Every county scored on public community life density (not campaign scores).

| Dimension | Meaning |
|-----------|---------|
| Event density | Source-backed public events per capita |
| Institution density | Anchors indexed vs expected |
| Volunteer density | VFD + service + student opportunities |
| Community anchor density | Extension, chamber, library, fair, major employers |
| Cultural diversity density | Cultural community lane coverage |
| Recreation density | Parks, trails, state parks, athletics |

**Outputs:** County health dashboard · underserved county list · harvest priority queue for AI Brain 3.0.

**Schema:** `data/community-systems/community-health-score-schema.json`

---

## Sequence

```text
Pass 32  Festival density ✅ (107 approved, pipeline live)
Pass 33  County fair completion
Pass 34  Extension / 4-H / Homemakers
Pass 35  VFD network
Pass 36  Church community events
Pass 36.5 Cultural community layer
Pass 37  Farmers markets / food trucks
Pass 37.5 Music / concert intelligence
Pass 38  Narrative enrichment + Community DNA + guide pages
Pass 39  Community influence graph
Pass 40  Community health score
```

## North-star metrics (by Pass 40)

| Metric | Pass 32 | Target |
|--------|---------|--------|
| Public visible events | ~2,025 | **5,000+** |
| Institution/tradition profiles | ~488 | **15,000+** |
| Influence graph nodes | 0 | **25,000+** |
| Counties with health score | 0 | **75** |
| Discovery guide pages | 0 | **9+ live** |
| AI gap tasks (open) | 144 | research director mode |
