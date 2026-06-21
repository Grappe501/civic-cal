import { ARKANSAS_COUNTIES } from "../counties";
import type { CivicEvent } from "../types";
import { computeCoverageScore, countCountyEvents } from "./countyDensityScore";
import { detectCoverageGaps } from "./gapDetection";
import type { CountyDensitySnapshot, DensityEngineReport } from "./densityTypes";
import { countInstitutions, feederCityCount } from "./institutionInventory";
import {
  buildInstitutionProjections,
  projectedEventCountForCounty,
  sourceFeedsForCounty,
  traditionsForCounty,
  volunteerOpportunitiesForCounty,
} from "./projectedEventStream";

export function buildCountyDensitySnapshot(county: string, events: CivicEvent[]): CountyDensitySnapshot {
  const institutions = countInstitutions(county);
  const eventCounts = countCountyEvents(county, events);
  const citiesInCounty = feederCityCount(county);
  const recurringTraditions = traditionsForCounty(county);
  const volunteerOpportunities = volunteerOpportunitiesForCounty(county);
  const sourceFeedsDiscovered = sourceFeedsForCounty(county);
  const projectedFutureEvents = projectedEventCountForCounty(county);

  const coverageScore = computeCoverageScore({
    institutionsTotal: institutions.total,
    eventsTotal: eventCounts.total,
    eventsThisMonth: eventCounts.thisMonth,
    institutionsWithEvents: eventCounts.institutionsWithEvents,
    recurringTraditions,
    volunteerOpportunities,
    sourceFeedsDiscovered,
    citiesInCounty,
    projectedFutureEvents,
  });

  const gaps = detectCoverageGaps({
    county,
    institutions,
    events: eventCounts,
    recurringTraditions,
    volunteerOpportunities,
    sourceFeedsDiscovered,
    citiesInCounty,
  });

  return {
    county,
    citiesInCounty,
    institutions,
    events: eventCounts,
    recurringTraditions,
    volunteerOpportunities,
    sourceFeedsDiscovered,
    projectedFutureEvents,
    coverageScore,
    gaps,
  };
}

export function buildDensityEngineReport(events: CivicEvent[]): DensityEngineReport {
  const counties = ARKANSAS_COUNTIES.map((c) => buildCountyDensitySnapshot(c, events)).sort(
    (a, b) => a.coverageScore - b.coverageScore,
  );

  const allGaps = counties.flatMap((c) => c.gaps.map((g) => ({ ...g, county: c.county })));
  const severityRank = { critical: 0, high: 1, medium: 2 };
  allGaps.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  const totalProjected = counties.reduce((n, c) => n + c.projectedFutureEvents, 0);

  return {
    generatedAt: new Date().toISOString(),
    totalProjectedFutureEvents: totalProjected,
    counties,
    bottomCounties: counties.slice(0, 15),
    topGaps: allGaps.slice(0, 25),
  };
}

export function getCountyDensity(county: string, events: CivicEvent[]): CountyDensitySnapshot {
  return buildCountyDensitySnapshot(county, events);
}

export { buildInstitutionProjections };
