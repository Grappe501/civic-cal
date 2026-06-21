#!/usr/bin/env node
/**
 * Pass 23A — aggregate feed attachment coverage (institutions → feeds → projected yield).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_FILE = path.join(ROOT, "data/feeds/feed-attachment-report.json");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function normCounty(c) {
  return String(c).replace(/\s+County$/i, "").trim();
}

const slotTypes = readJson("data/feeds/feed-slot-types.json");
const patterns = readJson("data/feeds/feed-discovery-patterns.json");
let institutionFeeds = [];
try {
  institutionFeeds = readJson("data/feeds/institution-feed-registry.json").feeds ?? [];
} catch {
  institutionFeeds = [];
}
const countyFeeds = readJson("data/feeds/county-feed-registry.json").feeds ?? [];
const cityFeeds = readJson("data/feeds/city-feed-registry.json").feeds ?? [];
const density = readJson("data/density/county-density-report.json");
const churches = readJson("data/institutions/church-directory.json").churches ?? [];
const schools = readJson("data/institutions/school-directory.json").schools ?? [];
const colleges = readJson("data/institutions/college-directory.json").colleges ?? [];
const orgs = readJson("data/institutions/civic-organizations.json").organizations ?? [];
const extensions = readJson("data/institutions/community-anchors-directory.json").extension_offices ?? [];
const homemakers = readJson("data/institutions/community-anchors-directory.json").homemaker_clubs ?? [];
const seedEvents = [
  ...(readJson("data/seed-events.json").events ?? []),
  ...(readJson("data/seed-events-public-demo.json").events ?? []),
];
const partySummary = readJson("data/ingestion/political-party-meetings-summary.json");

function institutionCounts(county) {
  const c = normCounty(county).toLowerCase();
  const f = (rows, key = "county") => rows.filter((r) => String(r[key] ?? "").toLowerCase() === c);
  const ch = f(churches).length;
  const sc = f(schools).length;
  const co = f(colleges).length;
  const org = f(orgs).length;
  const ext = f(extensions).length;
  const hom = f(homemakers).length;
  return { churches: ch, schools: sc, colleges: co, organizations: org, extensionOffices: ext, homemakerClubs: hom, total: ch + sc + co + org + ext + hom };
}

function projectedInstitutionYield(counts) {
  const y = slotTypes.institutionYield;
  return (
    counts.schools * y.school +
    counts.churches * y.church +
    counts.colleges * y.college +
    counts.organizations * y.organization +
    counts.extensionOffices * y.extension_office +
    counts.homemakerClubs * y.homemaker_club
  );
}

const allSlotFeeds = [...countyFeeds, ...cityFeeds];
const allFeeds = [...allSlotFeeds, ...institutionFeeds];
const attachedSlots = allSlotFeeds.filter((f) => f.attachment_status === "attached");
const attachedInst = institutionFeeds.filter((f) => f.attachment_status === "attached");
const attached = [...attachedSlots, ...attachedInst];
const missing = allSlotFeeds.filter((f) => f.attachment_status === "missing");
const searchOnly = allSlotFeeds.filter((f) => f.attachment_status === "search_only");
const attachmentGoal = patterns.statewideGoalAttachedFeeds ?? 1500;

const countyRows = [];
for (const row of density.counties ?? []) {
  const county = row.county;
  const cLower = normCounty(county).toLowerCase();
  const countySlots = countyFeeds.filter((f) => normCounty(f.county).toLowerCase() === cLower);
  const citySlots = cityFeeds.filter((f) => normCounty(f.county).toLowerCase() === cLower);
  const instFeeds = institutionFeeds.filter((f) => normCounty(f.county).toLowerCase() === cLower);
  const slots = [...countySlots, ...citySlots];
  const inst = institutionCounts(county);
  const feedsAttached = slots.filter((s) => s.attachment_status === "attached").length + instFeeds.filter((s) => s.attachment_status === "attached").length;
  const feedsMissing = slots.filter((s) => s.attachment_status === "missing").length;
  const feedsSearchOnly = slots.filter((s) => s.attachment_status === "search_only").length;
  const slotExpected = slots.length;
  const coveragePercent = slotExpected > 0 ? Math.round((slots.filter((s) => s.attachment_status === "attached").length / slotExpected) * 100) : 0;
  const attachedYield =
    slots.filter((s) => s.attachment_status === "attached").reduce((n, s) => n + (s.expected_annual_yield ?? s.expected_yield ?? 0), 0) +
    instFeeds.reduce((n, s) => n + (s.expected_annual_yield ?? 0), 0);
  const potentialYield = slots.reduce((n, s) => n + (s.expected_yield ?? 0), 0) + projectedInstitutionYield(inst);

  countyRows.push({
    county,
    institutions: inst.total,
    institutionBreakdown: inst,
    feedSlotsExpected: slotExpected,
    feedsAttached,
    feedsMissing,
    feedsSearchOnly,
    coveragePercent,
    verifiedEvents: row.events?.total ?? 0,
    attachedProjectedYield: attachedYield,
    potentialProjectedYield: potentialYield,
    densityProjectedEvents: row.projectedFutureEvents ?? 0,
    institutionFeedsAttached: instFeeds.length,
  });
}

countyRows.sort((a, b) => a.coveragePercent - b.coveragePercent);

const cityRows = [];
const byCity = new Map();
for (const f of cityFeeds) {
  const key = f.city.toLowerCase();
  if (!byCity.has(key)) byCity.set(key, { city: f.city, county: f.county, slots: [] });
  byCity.get(key).slots.push(f);
}
for (const [, row] of byCity) {
  const attachedN = row.slots.filter((s) => s.attachment_status === "attached").length;
  cityRows.push({
    city: row.city,
    county: row.county,
    feedSlotsExpected: row.slots.length,
    feedsAttached: attachedN,
    feedsMissing: row.slots.length - attachedN,
    coveragePercent: row.slots.length ? Math.round((attachedN / row.slots.length) * 100) : 0,
    attachedProjectedYield: row.slots.filter((s) => s.attachment_status === "attached").reduce((n, s) => n + (s.expected_yield ?? 0), 0),
    potentialProjectedYield: row.slots.reduce((n, s) => n + (s.expected_yield ?? 0), 0),
  });
}
cityRows.sort((a, b) => a.coveragePercent - b.coveragePercent);

const report = {
  generatedAt: new Date().toISOString(),
  metrics: {
    knownInstitutions: churches.length + schools.length + colleges.length + orgs.length + extensions.length + homemakers.length,
    feedSlotsTotal: allSlotFeeds.length,
    institutionFeedsTotal: institutionFeeds.length,
    totalFeedRecords: allFeeds.length,
    feedsAttached: attached.length,
    slotFeedsAttached: attachedSlots.length,
    institutionFeedsAttached: attachedInst.length,
    feedsMissing: missing.length,
    feedsSearchOnly: searchOnly.length,
    coveragePercent: allSlotFeeds.length ? Math.round((attachedSlots.length / allSlotFeeds.length) * 100) : 0,
    attachmentGoal,
    attachmentGoalProgress: attachmentGoal ? Math.round((attached.length / attachmentGoal) * 100) : 0,
    feedsToGoal: Math.max(0, attachmentGoal - attached.length),
    verifiedEventCount: seedEvents.length,
    stagedPartyMeetings: partySummary.stagedCandidates ?? 0,
    attachedProjectedYield:
      attachedSlots.reduce((n, f) => n + (f.expected_annual_yield ?? f.expected_yield ?? 0), 0) +
      attachedInst.reduce((n, f) => n + (f.expected_annual_yield ?? 0), 0),
    potentialProjectedYield:
      allSlotFeeds.reduce((n, f) => n + (f.expected_yield ?? 0), 0) +
      countyRows.reduce((n, c) => n + projectedInstitutionYield(c.institutionBreakdown), 0),
    densityEngineProjected: density.totalProjectedFutureEvents ?? 0,
    densityEngineGoal: density.goalProjectedEvents ?? 5000,
  },
  counties: countyRows,
  bottomCounties: countyRows.slice(0, 15),
  bottomCities: cityRows.slice(0, 20),
  tier1Gaps: allSlotFeeds.filter((f) => f.tier === 1 && f.attachment_status !== "attached").slice(0, 40),
  topDiscoveryTargets: countyRows
    .filter((c) => c.feedsMissing > 20)
    .slice(0, 10)
    .map((c) => ({
      county: c.county,
      institutions: c.institutions,
      feedsAttached: c.feedsAttached,
      feedsMissing: c.feedsMissing,
      coveragePercent: c.coveragePercent,
      potentialProjectedYield: c.potentialProjectedYield,
    })),
};

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));

console.log(`[feeds:report] ${report.metrics.feedSlotsTotal} slots + ${report.metrics.institutionFeedsTotal} institution feeds`);
console.log(`[feeds:report] ${report.metrics.feedsAttached} attached (${report.metrics.coveragePercent}% slots) · goal ${attachmentGoal} (${report.metrics.attachmentGoalProgress}%)`);
console.log(`[feeds:report] attached yield ${report.metrics.attachedProjectedYield} · potential ${Math.round(report.metrics.potentialProjectedYield)}`);
console.log(`[feeds:report] → data/feeds/feed-attachment-report.json`);
