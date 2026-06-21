# Pass 28 — School Platform Parser Upgrade

Platform-aware parsers turn attached school URLs into **dated, reviewable events** — not auto-published.

## Platforms

| Platform | Parser |
|----------|--------|
| ICS / webcal | `parse-ics-feed.mjs` |
| Google Calendar embed | ICS discovery from embed CID |
| JSON-LD Event | `parsers/json-ld.mjs` |
| Localist (colleges) | API + multi-calendar ICS |
| Apptegy / Thrillshare | Embedded JSON + RSS |
| ArbiterLive | Athletics schedule HTML |
| MaxPreps | Schedule table HTML |
| DragonFly / GoFan | Ticket JSON blobs |
| School board recurring | Recurrence text → dated instances |
| Generic HTML | Date + keyword context |

## Commands

```bash
npm run schools:attach-urls
npm run schools:harvest-calendars
npm run audit:school-events
npm run schools:approve-events -- --all-parsed   # explicit publish only
```

## Approval requirements

Events must have **title, date, source name, source URL, confidence ≥ 50**. Projections (no date) never auto-approve.

## Pass 28 metric

```text
865 projection targets → 150+ dated parsed → review → approved
```
