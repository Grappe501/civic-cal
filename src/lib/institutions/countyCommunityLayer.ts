import type { CivicEvent } from "../types";
import { listChurches, listColleges, listOrganizations, listSchools } from "./registry";
import type {
  CommunityStrengthIndicators,
  CountyCommunityInstitutionsLayer,
  InstitutionCoverageRow,
  SportsHubSnapshot,
} from "./types";

function normCounty(county: string): string {
  return county.replace(/\s+County$/i, "").toLowerCase();
}

function coverageRow(
  type: InstitutionCoverageRow["type"],
  label: string,
  known: number,
  verified: number,
  expected: number,
): InstitutionCoverageRow {
  const coveragePercent = expected > 0 ? Math.min(100, Math.round((verified / expected) * 100)) : 0;
  return { type, label, known, verified, expected, coveragePercent };
}

export function computeCountyCoverage(county: string, feederCityCount: number): InstitutionCoverageRow[] {
  const churches = listChurches(county);
  const schools = listSchools(county);
  const colleges = listColleges(county);
  const orgs = listOrganizations(county);
  const libraries = orgs.filter((o) => o.orgType === "library");
  const hospitals = orgs.filter((o) => o.orgType === "hospital");
  const vfds = orgs.filter((o) => o.orgType === "vfd");
  const civicOrgs = orgs.filter((o) => !["library", "hospital"].includes(o.orgType));

  const churchExpected = Math.max(3, feederCityCount * 3);
  const schoolExpected = Math.max(2, feederCityCount * 2);
  const collegeExpected = colleges.length > 0 ? colleges.length : feederCityCount >= 3 ? 1 : 0;
  const libraryExpected = Math.max(1, Math.ceil(feederCityCount / 4));
  const orgExpected = Math.max(5, feederCityCount * 2);

  return [
    coverageRow("churches", "Churches", churches.length, churches.filter((c) => c.verified).length, churchExpected),
    coverageRow("schools", "Schools", schools.length, schools.filter((s) => s.verified).length, schoolExpected),
    coverageRow("colleges", "Colleges", colleges.length, colleges.filter((c) => c.verified).length, collegeExpected),
    coverageRow("libraries", "Libraries", libraries.length, libraries.filter((l) => l.verified).length, libraryExpected),
    coverageRow("hospitals", "Hospitals", hospitals.length, hospitals.filter((h) => h.verified).length, Math.max(1, Math.ceil(feederCityCount / 8))),
    coverageRow("vfds", "VFDs", vfds.length, vfds.filter((v) => v.verified).length, Math.max(2, Math.ceil(feederCityCount / 3))),
    coverageRow("organizations", "Organizations", civicOrgs.length, civicOrgs.filter((o) => o.verified).length, orgExpected),
  ];
}

export function computeCommunityStrength(
  county: string,
  events: CivicEvent[],
  recurringTraditions: string[],
): CommunityStrengthIndicators {
  const countyNorm = normCounty(county);
  const countyEvents = events.filter((e) => e.county.toLowerCase() === countyNorm);
  const orgs = listOrganizations(county);

  return {
    churchCount: listChurches(county).length,
    schoolCount: listSchools(county).length,
    collegePresence: listColleges(county).length > 0,
    collegeCount: listColleges(county).length,
    festivalCount: countyEvents.filter((e) => /fair|festival|parade|rodeo/i.test(e.title)).length,
    volunteerOrganizationCount: orgs.filter((o) =>
      ["rotary", "lions", "kiwanis", "farm_bureau", "ffa", "four_h", "chamber"].includes(o.orgType),
    ).length,
    recurringTraditionCount: recurringTraditions.length,
    annualEventCount: countyEvents.filter((e) => e.isRecurring || /annual/i.test(e.title)).length,
    libraryCount: orgs.filter((o) => o.orgType === "library").length,
    hospitalCount: orgs.filter((o) => o.orgType === "hospital").length,
    vfdCount: orgs.filter((o) => o.orgType === "vfd").length,
  };
}

export function buildCountyCommunityLayer(
  county: string,
  feederCityCount: number,
  events: CivicEvent[],
  recurringTraditions: string[] = [],
): CountyCommunityInstitutionsLayer {
  return {
    county,
    churches: listChurches(county),
    schools: listSchools(county),
    colleges: listColleges(county),
    organizations: listOrganizations(county),
    coverage: computeCountyCoverage(county, feederCityCount),
    strength: computeCommunityStrength(county, events, recurringTraditions),
  };
}

export function buildSportsHubSnapshot(county: string, events: CivicEvent[]): SportsHubSnapshot {
  const countyNorm = normCounty(county);
  const sportsEvents = events.filter((e) => e.county.toLowerCase() === countyNorm && (
    e.category === "school" || /football|basketball|baseball|softball|soccer|track|band|game|rivalry|tournament|championship/i.test(`${e.title} ${e.description ?? ""}`)
  ));

  const count = (pattern: RegExp) => sportsEvents.filter((e) => pattern.test(`${e.title} ${e.description ?? ""}`)).length;

  return {
    county,
    highSchool: {
      football: count(/football/i),
      basketball: count(/basketball/i),
      baseball: count(/baseball/i),
      softball: count(/softball/i),
      soccer: count(/soccer/i),
      track: count(/track/i),
      band: count(/band/i),
    },
    college: {
      scheduledHomeGames: sportsEvents.filter((e) => /college|university|uc[a]|ualr|atu|a-state|razorback/i.test(`${e.title} ${e.city ?? ""}`)).length,
      tournaments: count(/tournament|championship/i),
    },
    upcomingSportsEvents: sportsEvents.slice(0, 10).map((e) => ({
      title: e.title,
      city: e.city ?? undefined,
      slug: e.slug,
      rdScore: e.relationshipDensityScore ?? undefined,
    })),
  };
}
