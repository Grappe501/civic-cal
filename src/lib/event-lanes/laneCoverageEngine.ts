import discoveredSources from "../../../data/ingestion/discovered-sources/top-200-city-sources.json";
import traditionsBundle from "../../../data/ingestion/recurring-events-registry.json";
import studentBundle from "../../../data/student-service/seed-opportunities.json";
import type { CivicEvent } from "../types";
import { listChurches, listColleges, listOrganizations, listSchools } from "../institutions/registry";
import { listExtensionOffices, listHomemakerClubs, listVfdAnchors } from "../institutions/communityAnchorsRegistry";
import { citiesInCounty, listCityDossiers } from "../local-intelligence/registry";
import { filterEventsByLane } from "./laneMatcher";
import { listLanes, phase1LaneIds } from "./laneRegistry";
import type { CalendarLaneDefinition, GeoLaneCoverage, LaneCoverageRow, LaneCoverageStatus } from "./laneTypes";

function normCounty(county: string): string {
  return county.replace(/\s+County$/i, "").trim();
}

function normCity(city: string): string {
  return city.trim().toLowerCase();
}

function statusFromCoverage(pct: number, events: number): LaneCoverageStatus {
  if (pct >= 70 || events >= 8) return "filled";
  if (pct >= 35 || events >= 3) return "thin";
  if (events > 0 || pct >= 15) return "ready_for_harvest";
  return "missing";
}

function countSourcesForLane(county: string, city: string | undefined, lane: CalendarLaneDefinition): number {
  if (!lane.sourceTypes?.length) return 0;
  const cNorm = normCounty(county).toLowerCase();
  const cities = (discoveredSources as { cities?: { county?: string; city?: string; source_templates?: { source_type?: string }[] }[] }).cities ?? [];
  let n = 0;
  for (const row of cities) {
    if (normCounty(row.county ?? "").toLowerCase() !== cNorm) continue;
    if (city && normCity(row.city ?? "") !== normCity(city)) continue;
    for (const t of row.source_templates ?? []) {
      if (lane.sourceTypes.includes(t.source_type ?? "")) n++;
    }
  }
  return n;
}

function countInstitutionsForLane(county: string, city: string | undefined, lane: CalendarLaneDefinition): number {
  const c = normCounty(county);
  const cityFilter = city
    ? (x: { city?: string | null }) => normCity(x.city ?? "") === normCity(city)
    : () => true;

  switch (lane.id) {
    case "schools":
      return listSchools(c).filter(cityFilter).length;
    case "churches":
      return listChurches(c).filter(cityFilter).length;
    case "colleges":
      return listColleges(c).filter(cityFilter).length;
    case "community_anchors":
      return listExtensionOffices(c).length + listHomemakerClubs(c).filter(cityFilter).length;
    case "vfds":
      return listVfdAnchors(c).filter(cityFilter).length;
    case "chambers":
      return listOrganizations(c, "chamber").filter(cityFilter).length;
    case "civic_organizations":
      return listOrganizations(c)
        .filter((o) => ["rotary", "lions", "kiwanis"].includes(o.orgType) && cityFilter(o))
        .length;
    case "festivals":
      return (traditionsBundle.traditions ?? []).filter(
        (t) => normCounty(String(t.county ?? "")).toLowerCase() === c.toLowerCase() && (!city || normCity(t.city ?? "") === normCity(city)),
      ).length;
    case "volunteer":
    case "student_service":
      return ((studentBundle as { opportunities?: { county?: string; city?: string }[] }).opportunities ?? []).filter(
        (o) =>
          normCounty(o.county ?? "").toLowerCase() === c.toLowerCase() &&
          (!city || normCity(o.city ?? "") === normCity(city)),
      ).length;
    case "government_civic":
      return city ? 1 : citiesInCounty(c).length;
    default:
      return 0;
  }
}

function expectedSlots(county: string, city: string | undefined, lane: CalendarLaneDefinition): number {
  const exp = lane.expectedPerCounty ?? {};
  const cities = city ? 1 : Math.max(1, citiesInCounty(normCounty(county)).length);
  const inst = countInstitutionsForLane(county, city, lane);

  let expected = exp.base ?? 0;
  if (exp.perCity) expected += Math.ceil(exp.perCity * cities);
  if (exp.perSchool) expected += (inst || listSchools(normCounty(county)).filter(city ? (s) => normCity(s.city) === normCity(city) : () => true).length) * exp.perSchool;
  if (exp.perChurch) expected += (inst || listChurches(normCounty(county)).filter(city ? (ch) => normCity(ch.city) === normCity(city) : () => true).length) * exp.perChurch;
  if (exp.perCollege) expected += listColleges(normCounty(county)).filter(city ? (co) => normCity(co.city) === normCity(city) : () => true).length * (exp.perCollege ?? 0);
  if (exp.perVfd) expected += Math.max(inst, listVfdAnchors(normCounty(county)).length) * (exp.perVfd ?? 0);

  if (lane.id === "schools" && inst > 0) expected = Math.max(expected, inst * (exp.perSchool ?? 3));
  if (lane.id === "churches" && inst > 0) expected = Math.max(expected, inst * (exp.perChurch ?? 2));

  return Math.max(expected, lane.id === "host_submitted" ? 0 : 1);
}

function computeLaneRow(
  lane: CalendarLaneDefinition,
  county: string,
  city: string | undefined,
  events: CivicEvent[],
): LaneCoverageRow {
  const scoped = events.filter((e) => {
    if (normCounty(e.county).toLowerCase() !== normCounty(county).toLowerCase()) return false;
    if (city && normCity(e.city ?? "") !== normCity(city)) return false;
    return true;
  });

  const laneEvents = filterEventsByLane(scoped, lane.id);
  const sourcesOnFile = countSourcesForLane(county, city, lane);
  const institutionsTracked = countInstitutionsForLane(county, city, lane);
  const expected = expectedSlots(county, city, lane);

  const eventScore = expected > 0 ? Math.min(100, (laneEvents.length / expected) * 100) : laneEvents.length > 0 ? 100 : 0;
  const sourceScore = expected > 0 ? Math.min(100, (sourcesOnFile / Math.max(1, expected * 0.5)) * 100) : 0;
  const institutionScore =
    institutionsTracked > 0 && expected > 0 ? Math.min(100, (institutionsTracked / Math.max(1, expected / 3)) * 100) : 0;

  const coveragePercent = Math.round(
    lane.id === "host_submitted"
      ? Math.min(100, laneEvents.length * 10)
      : eventScore * 0.5 + sourceScore * 0.25 + institutionScore * 0.25,
  );

  return {
    laneId: lane.id,
    laneNumber: lane.number,
    shortName: lane.shortName,
    coveragePercent,
    status: statusFromCoverage(coveragePercent, laneEvents.length),
    eventsIndexed: laneEvents.length,
    sourcesOnFile,
    institutionsTracked,
    expectedSlots: expected,
    harvestPriority: lane.harvestPriority,
  };
}

export function buildCountyLaneCoverage(county: string, events: CivicEvent[]): GeoLaneCoverage {
  const lanes = listLanes().map((lane) => computeLaneRow(lane, county, undefined, events));
  const phase1 = lanes.filter((l) => phase1LaneIds().includes(l.laneId));
  const overallCoverage = Math.round(lanes.reduce((s, l) => s + l.coveragePercent, 0) / Math.max(1, lanes.length));
  const phase1Coverage = Math.round(phase1.reduce((s, l) => s + l.coveragePercent, 0) / Math.max(1, phase1.length));

  return {
    geoType: "county",
    county: normCounty(county),
    overallCoverage,
    phase1Coverage,
    lanes,
    generatedAt: new Date().toISOString(),
  };
}

export function buildCityLaneCoverage(city: string, county: string, events: CivicEvent[]): GeoLaneCoverage {
  const lanes = listLanes().map((lane) => computeLaneRow(lane, county, city, events));
  const phase1 = lanes.filter((l) => phase1LaneIds().includes(l.laneId));
  const overallCoverage = Math.round(lanes.reduce((s, l) => s + l.coveragePercent, 0) / Math.max(1, lanes.length));
  const phase1Coverage = Math.round(phase1.reduce((s, l) => s + l.coveragePercent, 0) / Math.max(1, phase1.length));

  return {
    geoType: "city",
    county: normCounty(county),
    city,
    overallCoverage,
    phase1Coverage,
    lanes,
    generatedAt: new Date().toISOString(),
  };
}

export function buildAllLaneCoverage(events: CivicEvent[]): { counties: GeoLaneCoverage[]; cities: GeoLaneCoverage[] } {
  const countySet = new Set<string>();
  for (const c of listCityDossiers()) countySet.add(normCounty(c.county));
  for (const e of events) countySet.add(normCounty(e.county));

  const counties = [...countySet].sort().map((c) => buildCountyLaneCoverage(c, events));
  const cities = listCityDossiers()
    .slice(0, 250)
    .map((d) => buildCityLaneCoverage(d.city, d.county, events));

  return { counties, cities };
}

/** Prefer committed JSON snapshot when present (CI/build artifact). */
let cachedBundle: { counties: GeoLaneCoverage[]; cities: GeoLaneCoverage[] } | null = null;

export async function loadLaneCoverageSnapshot(): Promise<{ counties: GeoLaneCoverage[]; cities: GeoLaneCoverage[] } | null> {
  if (cachedBundle) return cachedBundle;
  try {
    const countyMod = await import("../../../data/event-lanes/county-lane-coverage.json");
    const cityMod = await import("../../../data/event-lanes/city-lane-coverage.json");
    cachedBundle = {
      counties: ((countyMod.default ?? countyMod) as { counties: GeoLaneCoverage[] }).counties ?? [],
      cities: ((cityMod.default ?? cityMod) as { cities: GeoLaneCoverage[] }).cities ?? [],
    };
    return cachedBundle;
  } catch {
    return null;
  }
}

export function getCountyLaneCoverageFromSnapshot(
  county: string,
  snapshot: { counties: GeoLaneCoverage[] } | null,
  events: CivicEvent[],
): GeoLaneCoverage {
  const norm = normCounty(county).toLowerCase();
  const fromSnap = snapshot?.counties.find((c) => c.county.toLowerCase() === norm);
  if (fromSnap) return fromSnap;
  return buildCountyLaneCoverage(county, events);
}

export function getCityLaneCoverageFromSnapshot(
  city: string,
  county: string,
  snapshot: { cities: GeoLaneCoverage[] } | null,
  events: CivicEvent[],
): GeoLaneCoverage {
  const fromSnap = snapshot?.cities.find(
    (c) => c.city?.toLowerCase() === city.toLowerCase() && c.county.toLowerCase() === normCounty(county).toLowerCase(),
  );
  if (fromSnap) return fromSnap;
  return buildCityLaneCoverage(city, county, events);
}
