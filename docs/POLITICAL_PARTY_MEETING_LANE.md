# Public Party & Civic Political Meeting Lane (Lane 21)

## Purpose

Lane 21 indexes **neutral public civic meetings** — county party committee meetings, public candidate forums, and similar civic-political gatherings. This is **not** a campaign lane. Democratic, Republican, Libertarian, and future parties receive equal treatment.

## Neutrality rules

- Category labels: `public_party_meeting`, `county_party_committee`, `candidate_forum`, `civic_political_meeting`
- No partisan scoring, endorsements, persuasion language, or issue positions
- `political_opportunity_score` stays neutral (50) for party meetings
- Public display uses factual titles: e.g. "Pulaski County Republican Committee Meeting"

## Public-source-only policy

Sources must be official public pages:

- [Republican Party of Arkansas county committees](https://www.arkansasgop.org/countygop.html)
- [Democratic Party of Arkansas](https://www.arkdems.org/) county pages and calendar
- [Libertarian Party of Arkansas events](https://www.lpar.org/events/)
- County party sites when publicly listed (Benton, Garland, Washington, Yell, etc.)

Meetup or private groups are excluded unless publicly accessible without login.

## Admin approval before publishing

All harvested party meetings enter `event_ingestion_candidates` with:

- `review_status: needs_review`
- `source_type: political_party_public_page`

Nothing publishes to the public calendar until an operator approves (single event or recurring series).

## Harvest commands

```bash
npm run harvest:party-meetings
npm run discover:party-sources
```

Outputs:

- `data/ingestion/political-party-meetings-raw.json`
- `data/ingestion/political-party-meetings-staged.json`
- `data/ingestion/political-party-meetings-summary.json`

## Recurrence handling

When recurrence is clear (e.g. "4th Thursday 6:00 PM"), the harvester expands staged future dates through **Nov 1, 2026**. When recurrence is ambiguous or "awaiting committee confirmation," candidates are staged **without invented dates** and flagged for human review.

## Admin filters

In **Admin → Event coverage**, filter by:

- Public party meetings
- Democratic / Republican / Libertarian county meetings
- Needs recurrence review
- Missing venue / missing next date

## Public badges

Approved events may show:

- Public civic meeting
- Party committee meeting
- Source verified (when confidence ≥ 70)
