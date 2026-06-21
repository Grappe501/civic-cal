# AI Brain Tooling Layer

Pass 29 adds a structured tooling layer so the online AI agent can search Arkansas Everywhere indexes, explain coverage gaps, and recommend harvest passes — without inventing facts.

## Governance

- **AI advises and prepares.** Humans approve publishing, verification, and campaign actions.
- Every answer includes **Based on…**, source URLs where available, data freshness, confidence, and what is missing.
- **Public mode** never exposes private campaign intelligence.

## Modes

| Mode | Endpoint input | Tools available |
|------|----------------|-----------------|
| `public` | Discovery / Ask Arkansas Everywhere | Events, places, orgs, calendar summaries |
| `admin` | `/admin/ai-brain` | All tools including feeds, staged ingestion, research tasks |
| `campaign` | Campaign Brain panel | Public tools + coverage, harvest, county fairs, research tasks |

## Tools (18)

| Tool | Purpose |
|------|---------|
| `searchEvents` | Query indexed public events |
| `searchOrganizations` | Churches, schools, civic orgs |
| `searchCities` / `searchCounties` | Place density |
| `searchCandidates` | Campaign workspaces (admin) |
| `searchFeeds` | County feed attachment (admin) |
| `searchStagedCandidates` | Pending ingestion (admin) |
| `searchCoverageGaps` | Thin counties + missing feeds |
| `getEventDossier` / `getCountyDossier` / `getCityDossier` | Structured dossiers |
| `getCandidateBrief` | Campaign workspace brief |
| `recommendHarvestTargets` | Rank next harvest counties |
| `explainEventPriority` | Index-level event factors |
| `summarizeCalendarRange` | Events in a date window |
| `findMissingSources` | Events without source URLs |
| `generateResearchTasks` | Open research queue |
| `findMissingCountyFairs` | All 75 counties — fair dates verified or not |

## Indexes

Generated under `data/ai-brain/`:

- `event-index.json`
- `place-index.json`
- `org-index.json`
- `feed-index.json`
- `candidate-index.json`
- `coverage-index.json`
- `source-index.json`
- `research-tasks.json` (via research-tasks script)

### Rebuild

```bash
cd H:/SOSWebsite/civic-call
npm run ai:build-indexes
npm run ai:research-tasks
```

Run after harvest passes, feed updates, or county fair verification changes.

## API

**POST** `/.netlify/functions/ai-brain`

```json
{
  "question": "Why is White County thin?",
  "mode": "admin",
  "campaignSlug": "kelly-grappe-sos",
  "county": "White",
  "city": "Searcy"
}
```

**Response:**

```json
{
  "answer": "…",
  "citedSources": [{ "url": "…", "label": "…" }],
  "recommendedActions": [],
  "confidence": "high",
  "toolCallsUsed": ["getCountyDossier", "searchCoverageGaps"],
  "needsHumanReview": false,
  "dataFreshness": "2026-06-21T…"
}
```

Uses `OPENAI_API_KEY` when present; falls back to deterministic tool routing + synthesis.

## UI surfaces

- **Admin:** `/admin/ai-brain` — full console with tool calls, citations, confidence, harvest recommendations
- **Campaign:** Campaign Brain panel on `/campaigns/:slug`
- **Public:** Ask Arkansas Everywhere (Discovery hero) → `mode: public`

## Research tasks

When gaps are found, tasks are written to `data/ai-brain/research-tasks.json`:

| Field | Description |
|-------|-------------|
| `task_type` | e.g. `county_fair_dates`, `feed_attachment` |
| `county` / `city` / `entity` | Target |
| `reason` | Why the task exists |
| `suggested_query` | Harvest/search hint |
| `priority` | `high` / `medium` / `low` |
| `status` | `open` / closed |

Regenerate: `npm run ai:research-tasks`

## Using AI to guide harvest passes

1. Rebuild indexes after any data lane merge.
2. Ask admin console: *"What should we harvest next to grow fastest?"*
3. Review `recommendedActions` and `research-tasks.json` — **approve** before running harvest scripts.
4. After harvest + approval, rebuild indexes again.

### Recommended next harvest pass (typical)

1. **County fair dates** — 67 counties still need verified 2026 dates (`findMissingCountyFairs`).
2. **Thin feed counties** — attach institution calendars where coverage &lt; 25%.
3. **Thin event counties** — city harvest for counties with &lt; 3 public events.

## Source files

- `src/lib/ai-brain/brainRegistry.ts` — modes and governance
- `src/lib/ai-brain/toolRegistry.ts` — tool catalog
- `src/lib/ai-brain/brainContext.ts` — index snapshot for UI
- `netlify/functions/lib/ai-brain-server.js` — server tool execution
- `scripts/ai-brain/build-ai-indexes.mjs` — index builder
