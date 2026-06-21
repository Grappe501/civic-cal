# Community Anchor Intelligence Engine (Pass 16)

Rural Arkansas intelligence sits at the intersection of **trust, relationships, leadership, volunteerism, food, agriculture, and families**. Community Anchors are the institutions campaigns rarely track systematically.

## Anchors tracked

| Anchor | Registry | Harvest |
|--------|----------|---------|
| Cooperative Extension Office | `community-anchors-directory.json` | 4-H, livestock, gardening, FCS events |
| Extension Homemakers | per-county club scaffolds | craft fairs, food events, fundraisers |
| Volunteer Fire Departments | `civic-organizations.json` (`vfd`) | fish fries, pancake breakfasts, BBQ |
| Parades | event categorization + profiles | Christmas, homecoming, veterans, fair |
| Arkansas Food Trail | discovery chip + county rollup | fish fries, church suppers, cookoffs |

## County dashboard

Route: `/campaigns/:slug/county/:countySlug`

**Community Anchors** section shows:

- Anchor counts (churches, schools, VFDs, Extension, Homemakers, etc.)
- **Events sourced by anchor** — measurable county coverage score
- Extension office block + homemaker clubs + VFD list
- Parade profiles (float/booth/candidate opportunities)
- Food trail events in county
- **Community attendance signals** — agriculture, faith, youth, seniors, veterans, business leaders, educators

Example:

```text
Conway County
Churches: 47 · Schools: 8 · VFDs: 12 · Homemaker clubs: 2

Events sourced this year:
Churches: 62 · VFDs: 17 · Extension: 24
County coverage score: 68%
```

## Commands

```bash
npm run generate:community-anchors   # 75 extension offices + 150 homemaker scaffolds
npm run generate:institutions        # VFDs + civic orgs (existing)
```

Harvest queries wired via `community-anchor-queries.mjs` → `city-query-builder.mjs`.

## Discovery (public)

New chips:

- **Arkansas Food Trail** — fish fries, church suppers, cookoffs
- **Parades** — dedicated category with float/booth intelligence on county brief
- **Community anchors** (candidate mode) — Extension, 4-H, Homemakers, VFD

## Integration

- **County Rollup 2.0** — `communityAnchors` on `CountyRollupView`
- **Institution Relationship Engine** — `extension_office`, `homemakers` kinds
- **Event Importance Engine** — homemaker/extension/VFD community importance boost
- **Morning brief** — institution seeds include Extension + Homemakers

## Privacy

Public staff directories and URLs only. No guessing attendance. Verify before marking `verified`.
