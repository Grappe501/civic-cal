# Community Platform Vision — Path 2

**Arkansas Everywhere** is a statewide **community platform** that campaigns happen to use — not a campaign tool with a public calendar attached.

## Public brand (always)

- Arkansas Community Calendar
- Arkansas Events
- Arkansas Community Intelligence
- **Arkansas Everywhere**

Campaign workspaces live at `/campaigns/*` — premium capability, footer link, not primary nav.

## The flywheel

```text
Organizations → Add events → Calendar grows → Citizens use it
→ AI learns patterns → Campaigns subscribe → Orgs gain visibility → More orgs join
```

Community organizations are permanent; campaigns come and go.

## Pass 18 — Host Portal & Organization Directory

### Public routes (SEO + AI)

| Route | Example | Purpose |
|-------|---------|---------|
| `/city/:slug` | `/city/conway` | City community calendar |
| `/:slug` | `/conway` | Flat SEO URL → city resolver |
| `/:slug-county` | `/conway-county` | County AI landing page |
| `/county/:slug` | `/county/conway` | Classic county calendar |
| `/organization/:slug` | `/organization/conway-chamber` | Org profile |
| `/organizations` | Index + county filter | Directory |
| `/host` | Host portal landing | Community hosts |
| `/host/dashboard` | Host dashboard (demo) | Manage events & claim org |

### Civic Glyph System

No letters, logos, or political symbols on the map. Custom glyph language in `src/lib/glyphs/civicGlyphs.ts`:

- Church ✦ · School ⬢ · Festival ⬟ · VFD ✹ · Extension ◈ · Campaign ◉ · etc.

### General volunteer layer

Not campaign-specific. Churches, festivals, races, VFDs, NAACP — any host can mark **Volunteers needed** on an event (`HostVolunteerControls` on event detail).

Campaign volunteer badges remain a separate premium layer (Pass 17).

### AI / search SEO

- JSON-LD on event, city, county, organization pages (`src/lib/seo/jsonLd.ts`)
- Plain-text `ai-readable-summary` blocks on geo pages
- `aiGuidePrompts()` for future guide generation

### Host types

Church, school, college, festival, chamber, Rotary, VFD, library, Farm Bureau, Extension, Homemakers, NAACP, 4-H, business, nonprofit, community (+ campaign as premium).

### Next: AI Discoverability Layer

- County/city/festival/food-trail/race **guide pages** (generated content assets)
- `llms.txt` / structured sitemap for AI crawlers
- Host auth + Supabase sync for org claims

See also: `docs/COMMUNITY_ANCHORS_LAYER.md`, `docs/CAMPAIGN_OS_VISION.md`
