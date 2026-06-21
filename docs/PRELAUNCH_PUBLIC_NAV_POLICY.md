# Pre-Launch Public Navigation Policy

Arkansas Everywhere is **calendar-first** during the pre-launch phase. All routes, harvest lanes, admin tools, and campaign systems continue to build behind the scenes — only **public navigation links and landing CTAs** are gated.

## What stays built

- All React routes (`/explore`, `/map`, `/campaigns`, etc.)
- Admin panels and data-health diagnostics
- Harvest pipelines, AI indexes, sitemap generation
- Campaign workspaces (admin/manual access)

## What is hidden by default (public)

Controlled by `src/lib/launch/launchFlags.ts`:

| Flag | Env override | Default |
|------|----------------|---------|
| Discover nav | `VITE_SHOW_DISCOVER_NAV` | off |
| Explore nav | `VITE_SHOW_EXPLORE_NAV` | off |
| Map nav | `VITE_SHOW_MAP_NAV` | off |
| Student Services nav | `VITE_SHOW_STUDENT_SERVICES_NAV` | off |
| Organizations nav | `VITE_SHOW_ORGANIZATIONS_NAV` | off |
| Races nav | `VITE_SHOW_RACES_NAV` | off |
| Campaign Workspaces nav | `VITE_SHOW_CAMPAIGN_WORKSPACES_NAV` | off |
| Homepage map | `VITE_SHOW_HOMEPAGE_MAP` + `VITE_GOOGLE_MAPS_API_KEY` | off |
| Homepage intent search | `VITE_SHOW_HOMEPAGE_INTENT_SEARCH` | off |
| Republican party meetings | `VITE_SHOW_REPUBLICAN_PARTY_MEETINGS` | **off** |

Set any env var to `true` to re-enable that surface without a code deploy of new routes.

## Public homepage focus

Until flags are enabled, `/` emphasizes:

- Arkansas Community Calendar
- Month / week / day calendar links
- Submit an event
- Featured fairs, festivals, Democratic county meetings
- County links where stable

Removed from public homepage (not deleted):

- Explore Arkansas / Event Safari / Race Circuit tabs
- “What are you looking for?” AI discovery hero
- Arkansas event map (unless API key + flag)
- Campaign workspace promotion

## Party meeting visibility

- **Democratic** county meetings: public, blue-themed cards
- **Republican** county meetings: **hidden from public calendar** until `VITE_SHOW_REPUBLICAN_PARTY_MEETINGS=true`
- **Libertarian** meetings: public when approved, amber/gold-themed cards

Compact calendar display priority (Dem meetings / fairs / festivals in crowded cells) remains unchanged.

## Maps

Homepage and nav map links require:

1. `VITE_SHOW_HOMEPAGE_MAP=true` (or `VITE_SHOW_MAP_NAV=true` for nav)
2. `VITE_GOOGLE_MAPS_API_KEY` set

If the key is missing, no empty/broken map renders on `/`.

## Admin inspection

- `/admin/data-health` — launch flags summary, Republican hidden count, maps configured
- Manual URL entry still reaches hidden routes for QA

## Turning features back on

Enable one flag at a time as calendar density improves:

```env
VITE_SHOW_MAP_NAV=true
VITE_GOOGLE_MAPS_API_KEY=your-key
VITE_SHOW_REPUBLICAN_PARTY_MEETINGS=true
```

Rebuild/redeploy after env changes.
