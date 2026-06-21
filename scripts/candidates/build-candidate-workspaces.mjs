#!/usr/bin/env node
/**
 * Pass 26 — Build campaign workspaces from candidate registry (neutral public data).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = path.join(ROOT, "data/candidates/candidate-registry.json");
const OUT = path.join(ROOT, "data/campaigns/discovered-campaign-workspaces.json");
const INITIAL = path.join(ROOT, "data/campaigns/initial-campaign-workspaces.json");

const THEME_POOL = [
  { primaryColor: "#1A1A1A", accentColor: "#2563EB", surfaceColor: "#F0F4F8" },
  { primaryColor: "#272727", accentColor: "#BD0000", surfaceColor: "#F8F6F3" },
  { primaryColor: "#1B4332", accentColor: "#40916C", surfaceColor: "#F1FAF5" },
  { primaryColor: "#2D2A26", accentColor: "#C9A227", surfaceColor: "#FAF8F5" },
];

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function districtTypeFromOffice(office) {
  const o = office.toLowerCase();
  if (/secretary of state|governor|attorney general|treasurer|auditor|land commissioner|statewide/.test(o)) return "statewide";
  if (/congress|u\.s\. house|house of representatives/.test(o)) return "congressional";
  if (/state senate/.test(o)) return "state_senate";
  if (/state house|state representative/.test(o)) return "state_house";
  if (/county/.test(o)) return "county";
  if (/mayor|city/.test(o)) return "city";
  if (/school/.test(o)) return "school_district";
  return "statewide";
}

function buildWorkspace(candidate, index) {
  const slug = candidate.dashboard_slug ?? slugify(`${candidate.name}-${candidate.office}`.slice(0, 80));
  const theme = THEME_POOL[index % THEME_POOL.length];
  const initials = candidate.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return {
    slug,
    campaign_name: `${candidate.name} for ${candidate.office.replace(/^for\s+/i, "")}`,
    candidate_name: candidate.name,
    office_sought: candidate.office,
    district_type: districtTypeFromOffice(candidate.office),
    district_name: candidate.district ?? candidate.county ?? "Arkansas",
    dashboard_label: `${candidate.name} — ${candidate.office}`,
    counties: candidate.county ? [candidate.county] : [],
    cities: candidate.city ? [candidate.city] : [],
    district_scope: {
      mode: districtTypeFromOffice(candidate.office),
      districtCode: candidate.district ?? "AR",
      districtBoundarySlug: slugify(`${districtTypeFromOffice(candidate.office)}-${candidate.district ?? "ar"}`),
      counties: candidate.county ? [candidate.county] : [],
      cities: candidate.city ? [candidate.city] : [],
      boundaryPrecision: "partial",
    },
    dashboard_theme: {
      ...theme,
      heroTagline: "Public candidate workspace — neutral civic calendar",
      logoInitials: initials,
      badgeLabel: candidate.party ?? "Nonpartisan",
      logoUrl: null,
    },
    notes: `Pass 26 discovered candidate · source: ${candidate.source} · ${candidate.source_url}`,
    is_active: true,
    access_mode: "beta_password",
    campaign_website_url: candidate.website,
    candidate_registry_id: candidate.id,
    party_label: candidate.party,
    race_type: candidate.race_type,
    filing_status: candidate.filing_status,
    verification_status: candidate.verification_status,
  };
}

function main() {
  if (!fs.existsSync(REGISTRY)) {
    console.error("Run npm run candidates:discover first");
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const initial = JSON.parse(fs.readFileSync(INITIAL, "utf8"));
  const existingSlugs = new Set((initial.workspaces ?? []).map((w) => w.slug));

  const toBuild = (registry.candidates ?? []).filter((c) => {
    if (c.has_dashboard && c.dashboard_slug) return false;
    if (c.race_type === "nonpartisan" && !c.party) return true;
    return c.party === "Democratic" || !c.party;
  });

  const discovered = [];
  let i = 0;
  for (const c of toBuild) {
    const ws = buildWorkspace(c, i++);
    if (existingSlugs.has(ws.slug)) continue;
    discovered.push(ws);
    existingSlugs.add(ws.slug);
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pass: "26",
        count: discovered.length,
        workspaces: discovered,
      },
      null,
      2,
    ),
  );

  console.log(`[candidates:build] ${discovered.length} new workspaces → ${OUT}`);
}

main();
