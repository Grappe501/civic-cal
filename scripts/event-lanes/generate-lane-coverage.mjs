#!/usr/bin/env node
/**
 * Pass 23 — generate county + city lane coverage JSON from bundled data.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = path.join(ROOT, "data/event-lanes");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function normCounty(c) {
  return String(c).replace(/\s+County$/i, "").trim();
}

function normCity(c) {
  return String(c).trim().toLowerCase();
}

const registry = readJson("data/event-lanes/calendar-lane-registry.json");
const lanes = registry.lanes;
const phase1Ids = new Set(registry.buildPhases.phase1.laneIds);

const events = [
  ...(readJson("data/seed-events.json").events ?? []),
  ...(readJson("data/seed-events-public-demo.json").events ?? []),
];

const churches = readJson("data/institutions/church-directory.json").churches ?? [];
const schools = readJson("data/institutions/school-directory.json").schools ?? [];
const colleges = readJson("data/institutions/college-directory.json").colleges ?? [];
const orgs = readJson("data/institutions/civic-organizations.json").organizations ?? [];
const anchors = readJson("data/institutions/community-anchors-directory.json");
const extensions = anchors.extension_offices ?? [];
const homemakers = anchors.homemaker_clubs ?? [];
const traditions = readJson("data/ingestion/recurring-events-registry.json").traditions ?? [];
const volunteers = readJson("data/student-service/seed-opportunities.json").opportunities ?? [];
const discovered = readJson("data/ingestion/discovered-sources/top-200-city-sources.json").cities ?? [];
const cities250 = readJson("data/local-intelligence/top-city-dossiers.json").cities ?? [];
const counties75 = readJson("data/arkansas-counties.json").counties ?? [];

function eventText(e) {
  return `${e.title} ${e.description ?? ""} ${e.hostOrganization ?? ""} ${e.category ?? ""}`.toLowerCase();
}

function matchesLane(e, lane) {
  if (lane.id === "host_submitted") return e.source === "host";
  return lane.matchPatterns.some((p) => eventText(e).includes(p.toLowerCase()));
}

function citiesInCounty(county) {
  const c = normCounty(county).toLowerCase();
  return cities250.filter((x) => normCounty(x.county).toLowerCase() === c);
}

function countSources(county, city, lane) {
  if (!lane.sourceTypes?.length) return 0;
  const c = normCounty(county).toLowerCase();
  let n = 0;
  for (const row of discovered) {
    if (normCounty(row.county).toLowerCase() !== c) continue;
    if (city && normCity(row.city) !== normCity(city)) continue;
    for (const t of row.source_templates ?? []) {
      if (lane.sourceTypes.includes(t.source_type)) n++;
    }
  }
  return n;
}

function countInst(county, city, lane) {
  const c = normCounty(county).toLowerCase();
  const cf = city ? (x) => normCity(x.city ?? x.city) === normCity(city) : () => true;
  switch (lane.id) {
    case "schools":
      return schools.filter((x) => normCounty(x.county).toLowerCase() === c && cf(x)).length;
    case "churches":
      return churches.filter((x) => normCounty(x.county).toLowerCase() === c && cf(x)).length;
    case "colleges":
      return colleges.filter((x) => normCounty(x.county).toLowerCase() === c && cf(x)).length;
    case "community_anchors":
      return extensions.filter((x) => normCounty(x.county).toLowerCase() === c).length + homemakers.filter((x) => normCounty(x.county).toLowerCase() === c && cf(x)).length;
    case "vfds":
      return orgs.filter((x) => normCounty(x.county).toLowerCase() === c && /vfd|fire/i.test(String(x.org_type ?? "")) && cf(x)).length;
    case "festivals":
      return traditions.filter((t) => normCounty(t.county).toLowerCase() === c && (!city || normCity(t.city ?? "") === normCity(city))).length;
    case "volunteer":
    case "student_service":
      return volunteers.filter((v) => normCounty(v.county).toLowerCase() === c && (!city || normCity(v.city ?? "") === normCity(city))).length;
    case "government_civic":
      return city ? 1 : citiesInCounty(county).length;
    default:
      return 0;
  }
}

function expected(county, city, lane) {
  const exp = lane.expectedPerCounty ?? {};
  const cityCount = city ? 1 : Math.max(1, citiesInCounty(county).length);
  let n = exp.base ?? 0;
  if (exp.perCity) n += Math.ceil(exp.perCity * cityCount);
  const inst = countInst(county, city, lane);
  if (exp.perSchool) n += schools.filter((x) => normCounty(x.county).toLowerCase() === normCounty(county).toLowerCase() && (!city || normCity(x.city) === normCity(city))).length * exp.perSchool;
  if (exp.perChurch) n += churches.filter((x) => normCounty(x.county).toLowerCase() === normCounty(county).toLowerCase() && (!city || normCity(x.city) === normCity(city))).length * exp.perChurch;
  if (exp.perCollege) n += colleges.filter((x) => normCounty(x.county).toLowerCase() === normCounty(county).toLowerCase() && (!city || normCity(x.city) === normCity(city))).length * (exp.perCollege ?? 0);
  if (lane.id === "schools" && inst) n = Math.max(n, inst * (exp.perSchool ?? 3));
  if (lane.id === "churches" && inst) n = Math.max(n, inst * (exp.perChurch ?? 2));
  return Math.max(n, lane.id === "host_submitted" ? 0 : 1);
}

function status(pct, events) {
  if (pct >= 70 || events >= 8) return "filled";
  if (pct >= 35 || events >= 3) return "thin";
  if (events > 0 || pct >= 15) return "ready_for_harvest";
  return "missing";
}

function buildGeo(county, city) {
  const cNorm = normCounty(county).toLowerCase();
  const scoped = events.filter((e) => {
    if (normCounty(e.county).toLowerCase() !== cNorm) return false;
    if (city && normCity(e.city ?? "") !== normCity(city)) return false;
    return true;
  });

  const laneRows = lanes.map((lane) => {
    const laneEvents = scoped.filter((e) => matchesLane(e, lane));
    const sourcesOnFile = countSources(county, city, lane);
    const institutionsTracked = countInst(county, city, lane);
    const expectedSlots = expected(county, city, lane);
    const eventScore = expectedSlots > 0 ? Math.min(100, (laneEvents.length / expectedSlots) * 100) : laneEvents.length ? 100 : 0;
    const sourceScore = expectedSlots > 0 ? Math.min(100, (sourcesOnFile / Math.max(1, expectedSlots * 0.5)) * 100) : 0;
    const institutionScore = institutionsTracked && expectedSlots ? Math.min(100, (institutionsTracked / Math.max(1, expectedSlots / 3)) * 100) : 0;
    const coveragePercent = Math.round(lane.id === "host_submitted" ? Math.min(100, laneEvents.length * 10) : eventScore * 0.5 + sourceScore * 0.25 + institutionScore * 0.25);

    return {
      laneId: lane.id,
      laneNumber: lane.number,
      shortName: lane.shortName,
      coveragePercent,
      status: status(coveragePercent, laneEvents.length),
      eventsIndexed: laneEvents.length,
      sourcesOnFile,
      institutionsTracked,
      expectedSlots,
      harvestPriority: lane.harvestPriority,
    };
  });

  const phase1 = laneRows.filter((l) => phase1Ids.has(l.laneId));
  const overallCoverage = Math.round(laneRows.reduce((s, l) => s + l.coveragePercent, 0) / laneRows.length);
  const phase1Coverage = Math.round(phase1.reduce((s, l) => s + l.coveragePercent, 0) / phase1.length);

  return {
    geoType: city ? "city" : "county",
    county: normCounty(county),
    ...(city ? { city } : {}),
    overallCoverage,
    phase1Coverage,
    lanes: laneRows,
  };
}

const generatedAt = new Date().toISOString();
const countyCoverage = counties75.map((c) => buildGeo(c, undefined));
const cityCoverage = cities250.map((d) => buildGeo(d.county, d.city));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, "county-lane-coverage.json"),
  JSON.stringify({ version: registry.version, generatedAt, counties: countyCoverage }, null, 2),
);
fs.writeFileSync(
  path.join(OUT_DIR, "city-lane-coverage.json"),
  JSON.stringify({ version: registry.version, generatedAt, cities: cityCoverage }, null, 2),
);

console.log(`[lanes:generate] ${countyCoverage.length} counties · ${cityCoverage.length} cities`);
console.log(`[lanes:generate] → data/event-lanes/county-lane-coverage.json`);
console.log(`[lanes:generate] → data/event-lanes/city-lane-coverage.json`);
