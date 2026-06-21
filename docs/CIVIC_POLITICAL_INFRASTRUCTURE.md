# Pass 25 — Civic Political Infrastructure Completion

## Purpose

Every Arkansas county gains a **neutral civic-political layer** in the knowledge graph — not just party meeting events, but durable organization profiles and coverage metrics.

```text
Official public sources → county party profiles → staged meetings → series approval → public calendar
```

## What Pass 25 adds

| Layer | Output |
|-------|--------|
| Democratic | 75 county committee page URLs + profiles |
| Republican | 75 county targets (72+ from arkansasgop.org) |
| Libertarian | State affiliate + events page indexed |
| Organization profiles | `/organization/{county}-county-{democrats\|republicans\|libertarians}` |
| Coverage metric | Political Infrastructure Coverage per county |
| Series approval | One admin action approves all recurring occurrences |

## Commands

```bash
npm run harvest:party-meetings          # GOP + 75 D templates + LP events
npm run build:political-infrastructure  # Org profiles + county coverage JSON
npm run party:approve-series -- --all-verified   # Bulk approve high-confidence R series
npm run audit:political-infrastructure
```

## Organization profile pages

Example: `/organization/faulkner-county-democrats`

Each profile includes:

- Meeting schedule (when public)
- Source links
- County served
- Confidence score + freshness date
- Related county civic-political density summary

## Verified recurring series approval

In **Admin → Event Intelligence**, filter **Public party meetings**. Recurring county committee series show **Approve entire series** — publishes all dated occurrences to `political-party-meetings-approved-events.json` (merged into public seed).

Trusted sources only: `political_party_public_page` from official state/county party pages.

## Political Infrastructure Coverage

Per county (3 party entities now; government bodies in Pass 26+):

- Democratic committee
- Republican committee
- Libertarian affiliate

Admin: `/admin/political-infrastructure`

## AI role (neutral)

**Not:** which party is better.

**Yes:** what civic-political infrastructure exists in this county?

See `src/lib/political-infrastructure/civicPoliticalDensityAssistant.ts`.

## Democratic fetch note

arkdems.org uses Cloudflare. Default harvest builds 75 URL templates without live fetch. Set `FORCE_DEM_FETCH=1` or `DEM_COUNTY_FETCH_LIMIT=10` to retry live page parse.

## Next passes

- Pass 26 — School Calendar Harvest
- Pass 27 — Church Event Harvest
- Pass 28 — Extension / Homemakers / 4-H
- Pass 29 — Volunteer Fire Department Harvest
