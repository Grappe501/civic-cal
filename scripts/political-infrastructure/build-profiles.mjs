#!/usr/bin/env node
/**
 * Pass 25 — Build political party organization profiles + county infrastructure coverage.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COUNTIES = JSON.parse(fs.readFileSync(path.join(ROOT, "data/arkansas-counties.json"), "utf8")).counties;
const REGISTRY = path.join(ROOT, "data/event-harvest/political-party-source-registry.json");
const RAW = path.join(ROOT, "data/ingestion/political-party-meetings-raw.json");
const STAGED = path.join(ROOT, "data/ingestion/political-party-meetings-staged.json");
const OUT_DIR = path.join(ROOT, "data/political-infrastructure");
const ORGS_OUT = path.join(OUT_DIR, "party-organizations.json");
const COVERAGE_OUT = path.join(OUT_DIR, "county-infrastructure-coverage.json");

const PARTIES = [
  { label: "Democratic", slug: "democrats", org: "Democratic Party of Arkansas" },
  { label: "Republican", slug: "republicans", org: "Republican Party of Arkansas" },
  { label: "Libertarian", slug: "libertarians", org: "Libertarian Party of Arkansas" },
];

function countySlug(c) {
  return c.toLowerCase().replace(/\s+/g, "-");
}

function orgSlug(county, partySlug) {
  return `${countySlug(county)}-county-${partySlug}`;
}

function readJson(p, fallback = null) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function bestRawForCountyParty(rawRecords, county, party) {
  return rawRecords.find((r) => r.county === county && r.party_label === party);
}

function stagedForSeries(staged, county, party) {
  const key = `${countySlug(county)}-${party.toLowerCase()}`;
  return staged.filter((c) => c.series_key === key || (c.county === county && c.party_label === party));
}

function confidenceFromRecord(raw, stagedList) {
  if (!raw && !stagedList.length) return 0;
  if (raw?.recurrence_text || raw?.meeting_info) return Math.min(95, raw.confidence_score ?? 70);
  if (stagedList.some((s) => s.event_date)) return 55;
  if (raw?.page_discovered || raw?.source_url) return 35;
  return 20;
}

function buildOrganizations(rawRecords, stagedCandidates, registry) {
  const orgs = [];
  const demPages = registry.democratic_county_pages ?? [];

  for (const county of COUNTIES) {
    for (const party of PARTIES) {
      const raw =
        party.label === "Democratic"
          ? demPages.find((p) => p.county === county)
          : bestRawForCountyParty(rawRecords, county, party.label);
      const stagedList = stagedForSeries(stagedCandidates, county, party.label);
      const meetingSchedule = raw?.recurrence_text || raw?.meeting_info || stagedList[0]?.recurrence_rule || null;
      const sourceUrl =
        raw?.source_url ||
        raw?.url ||
        (party.label === "Democratic" ? `https://www.arkdems.org/county/${countySlug(county)}/` : null) ||
        (party.label === "Republican" ? "https://www.arkansasgop.org/countygop.html" : null) ||
        (party.label === "Libertarian" ? "https://www.lpar.org/events/" : null);

      const confidence = confidenceFromRecord(raw, stagedList);
      const status =
        meetingSchedule && confidence >= 60
          ? "meeting_schedule_public"
          : raw?.page_discovered || raw?.fetch_blocked === false
            ? "page_discovered"
            : confidence > 0
              ? "partial"
              : "not_found";

      orgs.push({
        id: orgSlug(county, party.slug),
        slug: orgSlug(county, party.slug),
        name: `${county} County ${party.label}${party.label === "Libertarian" ? " Affiliate" : " Committee"}`,
        partyLabel: party.label,
        partySlug: party.slug,
        organization: party.org,
        county,
        entityType: "political_party_committee",
        meetingSchedule,
        recurrenceRule: stagedList[0]?.recurrence_rule ?? meetingSchedule,
        chairPublic: raw?.chair ?? null,
        venue: raw?.venue ?? stagedList[0]?.venue_name ?? null,
        sourceUrl,
        sourceLinks: [{ label: "Official public page", url: sourceUrl }].filter((l) => l.url),
        confidenceScore: confidence,
        freshnessDate: registry.updatedAt ?? new Date().toISOString().slice(0, 10),
        status,
        stagedEventCount: stagedList.length,
        fetchBlocked: raw?.fetch_blocked ?? false,
        seriesKey: `${countySlug(county)}-${party.label.toLowerCase()}`,
      });
    }
  }

  const lpStatewide = rawRecords.filter((r) => r.party_label === "Libertarian" && r.county === "Statewide");
  if (lpStatewide.length) {
    orgs.push({
      id: "arkansas-libertarian-party",
      slug: "arkansas-libertarian-party",
      name: "Libertarian Party of Arkansas",
      partyLabel: "Libertarian",
      partySlug: "libertarians",
      organization: "Libertarian Party of Arkansas",
      county: "Statewide",
      entityType: "political_party_state",
      meetingSchedule: null,
      sourceUrl: "https://www.lpar.org/events/",
      sourceLinks: [{ label: "Events calendar", url: "https://www.lpar.org/events/" }],
      confidenceScore: 45,
      freshnessDate: new Date().toISOString().slice(0, 10),
      status: "affiliate_indexed",
      stagedEventCount: lpStatewide.length,
      seriesKey: "statewide-libertarian",
    });
  }

  return orgs;
}

function entityFound(status) {
  return status === "meeting_schedule_public" || status === "page_discovered" || status === "partial" || status === "affiliate_indexed";
}

function buildCountyCoverage(organizations) {
  const ENTITY_TYPES = [
    { key: "democratic_committee", label: "Democratic committee", party: "Democratic" },
    { key: "republican_committee", label: "Republican committee", party: "Republican" },
    { key: "libertarian_affiliate", label: "Libertarian affiliate", party: "Libertarian" },
    { key: "school_board", label: "School board", stub: true },
    { key: "quorum_court", label: "Quorum court", stub: true },
    { key: "election_commission", label: "Election commission", stub: true },
    { key: "city_council", label: "City council", stub: true },
  ];

  return COUNTIES.map((county) => {
    const entities = ENTITY_TYPES.map((et) => {
      if (et.stub) {
        return { key: et.key, label: et.label, found: false, status: "pass_26_plus", confidence: 0, sourceUrl: null };
      }
      const org = organizations.find((o) => o.county === county && o.partyLabel === et.party);
      const found = org ? entityFound(org.status) : false;
      return {
        key: et.key,
        label: et.label,
        found,
        status: org?.status ?? "not_found",
        confidence: org?.confidenceScore ?? 0,
        sourceUrl: org?.sourceUrl ?? null,
        meetingSchedule: org?.meetingSchedule ?? null,
        organizationSlug: org?.slug ?? null,
      };
    });

    const scorable = entities.filter((e) => !e.status?.startsWith("pass_"));
    const foundCount = scorable.filter((e) => e.found).length;
    const coveragePercent = scorable.length ? Math.round((foundCount / scorable.length) * 100) : 0;

    return {
      county,
      countySlug: countySlug(county),
      entities,
      politicalInfrastructureFound: foundCount,
      politicalInfrastructureTotal: scorable.length,
      coveragePercent,
      fullInfrastructureNote: "School board, quorum court, election commission, city council — Pass 26+",
    };
  });
}

function main() {
  const registry = readJson(REGISTRY, {});
  const raw = readJson(RAW, { records: [] });
  const staged = readJson(STAGED, { candidates: [] });
  const organizations = buildOrganizations(raw.records ?? [], staged.candidates ?? [], registry);
  const countyCoverage = buildCountyCoverage(organizations);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    ORGS_OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), pass: "25", count: organizations.length, organizations }, null, 2),
  );
  fs.writeFileSync(
    COVERAGE_OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), pass: "25", counties: countyCoverage }, null, 2),
  );

  const demProfiles = organizations.filter((o) => o.partyLabel === "Democratic").length;
  const repWithSchedule = organizations.filter((o) => o.partyLabel === "Republican" && o.meetingSchedule).length;
  console.log(`[build:political-infrastructure] ${organizations.length} org profiles (${demProfiles} D · ${repWithSchedule} R with schedule)`);
  console.log(`[build:political-infrastructure] → ${ORGS_OUT}`);
}

main();
