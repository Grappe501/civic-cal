# Autogrow Engine (Pass 24)

## Purpose

Arkansas Everywhere grows over time through scheduled scans — not manual passes.

```text
Attached feeds → scan → stage candidates → admin approval → public calendar
```

## Hard rule

**AI advises. Humans approve.** Nothing auto-publishes unless trust rules explicitly allow later.

## Schedule

| Job | Cron | Script |
|-----|------|--------|
| Daily feed scan | `0 6 * * *` | `run-daily-feed-scan.mjs` |
| Weekly feed discovery | `0 7 * * 1` | `run-weekly-feed-discovery.mjs` |
| Weekly profile refresh | `0 8 * * 1` | `run-profile-refresh.mjs` |
| Weekly campaign briefings | `0 9 * * 1` | `run-candidate-briefings.mjs` |

Netlify: `scheduled-autogrow.js`, `scheduled-campaign-briefings.js`  
Fallback: `.github/workflows/autogrow.yml`

## Commands

```bash
npm run autogrow:daily
npm run autogrow:weekly-discovery
npm run autogrow:profiles
npm run autogrow:briefings
npm run autogrow:all
```

## Registry files

- `data/autogrow/autogrow-config.json`
- `data/autogrow/autogrow-runs.json`
- `data/autogrow/autogrow-health.json`
- `data/ingestion/autogrow-staged-candidates.json`

## Admin

`/admin/autogrow` — last run, queue size, manual triggers via `autogrow-run` function.

## What autogrow does NOT do

- Auto-publish events
- Invent attendance
- Bypass admin review queue
