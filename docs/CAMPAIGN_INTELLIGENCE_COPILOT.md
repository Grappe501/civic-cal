# Campaign Intelligence Copilot (Pass 24)

## Purpose

Campaign dashboards cut through noise: **where should the candidate be today, this week, this month?**

Logistics and opportunity planning only — not voter persuasion, not party ranking.

## Components

| File | Role |
|------|------|
| `src/lib/intelligence/campaignPriorityScore.ts` | Noise-cutter scoring + recommendation |
| `src/lib/ai/campaignIntelligenceCopilot.ts` | Today / week / month briefs |
| `src/lib/campaigns/campaignGoalSettings.ts` | Priority counties, travel, volunteers (localStorage) |
| `netlify/functions/campaign-copilot.js` | "Ask AI why" explanations |

## Recommendations

- `must_attend`
- `should_attend`
- `send_surrogate`
- `send_volunteers`
- `monitor_only`
- `skip`

Scoring uses: district match, PO/RD scores, tradition, attendance band, source confidence, freshness, travel burden, county gaps, conflicts.

## UI

`/campaigns/:slug` — Campaign Intelligence Copilot panel with Today / This Week / This Month tabs and **Ask AI why**.

## Campaign goal settings

Per-workspace localStorage:

- Priority counties / cities
- Max travel radius
- Volunteer capacity
- Candidate / surrogate availability
- Statewide vs district focus

## AI guardrails

See `data/ai/prompts/campaign-intelligence-copilot.json`:

- Facts from event/database only
- Label uncertainty
- Never invent attendance
- Never auto-publish
- No private personal data

## What requires human approval

- Changing plan status on events
- Public presence badges
- Publishing staged autogrow candidates
