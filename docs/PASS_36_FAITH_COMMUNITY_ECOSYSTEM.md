# Pass 36 — Faith Community Ecosystem

**Do not harvest worship service times.** They have almost no discovery value.

The gold is everything churches do **besides Sunday morning worship** — meals, family events, outreach, networks, and faith-adjacent civic rooms.

Every pass deliverable: **density · narrative depth · crawlable/searchable pages**.

---

## Strategic rule

| Harvest | Skip |
|---------|------|
| Fish fries, VBS, trunk-or-treat, food pantry days | Weekly worship schedules |
| Community forums hosted at churches | Sermon series |
| Blood drives, cleanups, school supply drives | Internal small-group meetings |
| Public-facing outreach with dates | Member-only events |

Uncertain → research task, not public calendar.

---

## Sub-lanes

### 36A — Community Meals

Highest relationship-density rooms in Arkansas.

- Fish fries
- Spaghetti suppers
- Wild game dinners
- Pancake breakfasts
- Chili suppers
- BBQ fundraisers
- Chicken dinners
- Food pantry distributions

**Tie-in:** Arkansas Food Trail (Pass 34E), VFD fundraisers (Pass 35), county fairs.

---

### 36B — Family Events

High traffic, high share value.

- Vacation Bible School
- Trunk or Treat
- Easter egg hunts
- Fall festivals
- Christmas programs
- Living nativity events
- Community movie nights

---

### 36C — Service & Outreach

Feeds volunteer opportunities, student service hours, community impact metrics.

- Clothing drives
- Blood drives
- School supply drives
- Community cleanups
- Disaster relief events
- Homeless outreach
- Food bank distributions

**Outputs:** link events → `/volunteer-opportunities` · student-service eligibility where verified.

---

### 36D — Men's / Women's Networks

Recurring, often well-attended.

- Men's breakfasts
- Women's conferences
- Retreats
- Marriage conferences
- Parenting workshops

---

### 36E — Faith + Civic Rooms

Important for community intelligence; campaign context stays admin-private.

- Candidate forums (public, source-backed)
- Prayer breakfasts (public listings only)
- National Day of Prayer gatherings
- Community forums
- Civic engagement events

**Public rule:** neutral civic-meeting framing — no partisan PO/RD on public pages.

---

## Church profile intelligence layer

Every church profile should eventually answer:

### About

- Denomination
- Founded (when sourced)
- Pastor (public listings only)
- Attendance estimate (verified tiers only — never guessed)
- Ministries

### Community Impact

- Food programs
- Outreach programs
- Volunteer opportunities

### Event Activity

- Events this year (calendar-linked)
- Recurring traditions
- Annual attendance estimates (when sourced)

### Connected Institutions

Links to schools, fairs, VFDs, Extension, food pantries, community partners.

---

## Community Influence Score (institution-level)

**Not political. Community.**

AI-assisted score: *"This institution produces community activity."*

| Signal | Weight |
|--------|--------|
| Verified attendance tier | baseline |
| Food / outreach programs | high |
| Recurring public events (meals, VBS, drives) | high |
| School / fair / VFD partnerships | medium |
| Volunteer + student-service events | medium |
| Annual tradition depth | medium |

**Examples:**

- Small church · ~75 attendance · no outreach · 2 annual events → **low influence**
- Mid church · ~350 attendance · food pantry · VBS · fish fry · school partnership · blood drives → **high influence**

**Schema target:** `data/faith-community/community-influence-score-schema.json`

**Admin-only detail** until verified; public pages show community impact summary only.

---

## Pipeline targets

| Output | Target |
|--------|--------|
| Church profiles enriched | existing directory + outreach fields |
| Approved public faith-community events | **500+** staged → approved |
| Research tasks | open queue per county gap |
| AI indexes | church · meal-tradition · volunteer-opportunity links |
| Narrative scaffolds | top 200 churches by influence score |

**Suggested commands (to implement):**

```bash
npm run harvest:faith-community
npm run approve:faith-community
npm run audit:faith-community
npm run narratives:build-scaffolds
npm run ai:build-indexes
npm run ai:research-tasks
npm run generate:sitemap
```

---

## Data layout (proposed)

```text
data/faith-community/
  church-outreach-profiles.json
  faith-community-event-staged.json
  faith-community-event-approved-events.json
  faith-community-research-tasks.json
  community-influence-scores.json
scripts/event-harvest/faith-community/
  harvest-faith-community-events.mjs
  classify-faith-event-lane.mjs
  approve-faith-community-events.mjs
  audit-faith-community-system.mjs
src/lib/faith-community/
  faithEventLanes.ts
  communityInfluenceScore.ts
  churchProfileIntelligence.ts
```

---

## QA checklist

- [ ] No worship-service-only events on public calendar
- [ ] Fish fry / meal events deduped against Pass 34E food trail
- [ ] Volunteer-eligible events linked to student-service engine
- [ ] Church profiles show Community Impact block (public-safe)
- [ ] Influence scores admin-only; no campaign PO on public church pages
- [ ] `npm run audit:county-duplicates` clean after merge
- [ ] typecheck · build · contrast green

---

## Why this lane matters

Churches touch almost every county, town, school, fair, food drive, volunteer effort, and civic event in Arkansas. **Faith Community Ecosystem** will likely generate more meaningful event density than any other remaining single lane — if we harvest community life, not bulletin boards full of service times.

See also: `docs/COMMUNITY_INSTITUTIONS_LAYER.md`, `docs/PASS_34_ARKANSAS_FOOD_AGRICULTURE_ECOSYSTEM.md`, `docs/PASSES_33_40_ROADMAP.md`.
