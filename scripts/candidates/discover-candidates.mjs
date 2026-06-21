#!/usr/bin/env node
/**
 * Pass 26 — Discover public candidate filings from Arkansas SOS + merge workspace seeds.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchSosCandidates, candidateSlug } from "./lib/sos-candidate-api.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "data/candidates/candidate-registry.json");
const WORKSPACES = path.join(ROOT, "data/campaigns/initial-campaign-workspaces.json");

function mapWorkspaceToCandidate(ws) {
  return {
    id: `ws-${ws.slug}`,
    slug: candidateSlug(ws.candidate_name, ws.office_sought),
    dashboard_slug: ws.slug,
    name: ws.candidate_name,
    office: ws.office_sought,
    party: inferPartyFromWorkspace(ws),
    race_type: "partisan",
    district: ws.district_name,
    county: ws.counties?.[0] ?? null,
    city: ws.cities?.[0] ?? null,
    website: ws.campaign_website_url ?? null,
    public_contact: null,
    source_url: ws.campaign_website_url ?? "https://candidates.arkansas.gov/",
    source: "campaign_workspace_seed",
    filing_status: "active_workspace",
    filing_date: null,
    verification_status: "verified_workspace",
    has_dashboard: true,
  };
}

function inferPartyFromWorkspace(ws) {
  const n = `${ws.campaign_name} ${ws.notes ?? ""}`.toLowerCase();
  if (/democrat/.test(n)) return "Democratic";
  if (/republican|gop/.test(n)) return "Republican";
  if (/libertarian/.test(n)) return "Libertarian";
  return null;
}

function mapSosRecord(row) {
  const slug = candidateSlug(row.name, row.office);
  return {
    id: `sos-${slug}`,
    slug,
    dashboard_slug: null,
    name: row.name,
    office: row.office,
    party: row.party,
    race_type: row.race_type,
    district: row.district,
    county: row.county,
    city: row.city,
    website: row.website,
    public_contact: row.public_contact,
    source_url: row.source_url,
    source: row.source,
    filing_status: row.filing_status,
    filing_date: row.filing_date,
    verification_status: row.verification_status,
    has_dashboard: false,
  };
}

async function main() {
  const { records: sosRows, notes } = await fetchSosCandidates();
  const workspaceBundle = JSON.parse(fs.readFileSync(WORKSPACES, "utf8"));
  const workspaceCandidates = (workspaceBundle.workspaces ?? []).map(mapWorkspaceToCandidate);

  const byKey = new Map();
  for (const c of sosRows.map(mapSosRecord)) byKey.set(`${c.name}|${c.office}`, c);
  for (const c of workspaceCandidates) {
    const key = `${c.name}|${c.office}`;
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, { ...existing, ...c, has_dashboard: c.has_dashboard || existing.has_dashboard, dashboard_slug: c.dashboard_slug ?? existing.dashboard_slug });
    } else {
      byKey.set(key, c);
    }
  }

  const candidates = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));

  const summary = {
    total: candidates.length,
    democratic: candidates.filter((c) => c.party === "Democratic").length,
    republican: candidates.filter((c) => c.party === "Republican").length,
    libertarian: candidates.filter((c) => c.party === "Libertarian").length,
    independent: candidates.filter((c) => c.party === "Independent").length,
    nonpartisan: candidates.filter((c) => !c.party || c.race_type === "nonpartisan").length,
    with_dashboard: candidates.filter((c) => c.has_dashboard).length,
    sos_api_notes: notes,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), pass: "26", summary, candidates }, null, 2),
  );

  console.log(`[candidates:discover] ${candidates.length} candidates (D:${summary.democratic} R:${summary.republican} NP:${summary.nonpartisan})`);
  console.log(`[candidates:discover] SOS notes: ${notes.join("; ")}`);
  console.log(`[candidates:discover] → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
