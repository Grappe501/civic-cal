import type { CivicEvent } from "../types";
import type { CampaignWorkspace, ScoredEvent } from "./types";
import { scoreEventForCampaign } from "./eventIntel";
import {
  countyBoundary,
  cityBoundary,
  getCountyCentroid,
  resolveWorkspaceBoundary,
  type DistrictBoundaryDefinition,
} from "./districtRegistry";
import { haversineMiles, normalizeCity, normalizeCounty, pointInGeoJson } from "./geoUtils";

export type EventDistrictZone = "inside" | "near" | "outside";

export interface ClassifiedCampaignEvent {
  scored: ScoredEvent;
  zone: EventDistrictZone;
  zoneReason: string;
}

export interface CampaignDistrictBreakdown {
  inside: ClassifiedCampaignEvent[];
  near: ClassifiedCampaignEvent[];
  statewideHighValue: ClassifiedCampaignEvent[];
  outsideCount: number;
  boundary: DistrictBoundaryDefinition | null;
  scopeLabel: string;
  totalEvents: number;
}

const HIGH_VALUE_PO = 75;
const HIGH_VALUE_RD = 80;
const STATEWIDE_EXCEPTION_PO = 85;

function matchCity(event: CivicEvent, cities: string[]): boolean {
  if (!cities.length || !event.city) return false;
  const city = normalizeCity(event.city);
  return cities.some((c) => city.includes(normalizeCity(c)) || normalizeCity(c).includes(city));
}

function classifyEventZone(event: CivicEvent, boundary: DistrictBoundaryDefinition): { zone: EventDistrictZone; reason: string } {
  if (boundary.districtType === "statewide") {
    return { zone: "inside", reason: "Statewide — all Arkansas" };
  }

  const county = normalizeCounty(event.county);
  const wholeSet = new Set(boundary.countiesWhole.map(normalizeCounty));
  const partialSet = new Set(boundary.countiesPartial.map(normalizeCounty));
  const nearSet = new Set(boundary.nearCounties.map(normalizeCounty));

  if (event.latitude != null && event.longitude != null && boundary.geojson) {
    const inside = pointInGeoJson(event.longitude, event.latitude, boundary.geojson);
    if (inside) return { zone: "inside", reason: "Inside district polygon" };
  }

  if (wholeSet.has(county)) {
    if (boundary.cities.length && !matchCity(event, boundary.cities)) {
      return { zone: "inside", reason: `Inside ${event.county} County (whole)` };
    }
    return { zone: "inside", reason: `Inside ${event.county} County` };
  }

  if (partialSet.has(county)) {
    if (boundary.cities.length && matchCity(event, boundary.cities)) {
      return { zone: "inside", reason: `Inside ${event.city} (partial county)` };
    }
    return { zone: "near", reason: `${event.county} County — partial district (verify precinct)` };
  }

  if (matchCity(event, boundary.cities)) {
    return { zone: "inside", reason: `City match: ${event.city}` };
  }

  if (nearSet.has(county)) {
    return { zone: "near", reason: `Adjacent/near county: ${event.county}` };
  }

  if (event.latitude != null && event.longitude != null && boundary.centroid) {
    const dist = haversineMiles(event.latitude, event.longitude, boundary.centroid.lat, boundary.centroid.lng);
    if (dist <= boundary.nearRadiusMiles) {
      return { zone: "near", reason: `Within ${Math.round(dist)} mi of district center` };
    }
  } else if (county && boundary.centroid) {
    const cc = getCountyCentroid(event.county ?? "");
    if (cc) {
      const dist = haversineMiles(cc.lat, cc.lng, boundary.centroid.lat, boundary.centroid.lng);
      if (dist <= boundary.nearRadiusMiles + 15) {
        return { zone: "near", reason: `County center near district (${event.county})` };
      }
    }
  }

  return { zone: "outside", reason: "Outside district scope" };
}

function isStatewideHighValue(scored: ScoredEvent, workspace: CampaignWorkspace): boolean {
  if (workspace.districtType === "statewide") return false;
  const { politicalOpportunityScore: po, relationshipDensityScore: rd, candidateUsefulness } = scored;
  if (po >= STATEWIDE_EXCEPTION_PO) return true;
  if (po >= HIGH_VALUE_PO && rd >= HIGH_VALUE_RD) return true;
  if (candidateUsefulness === "very_high" && po >= 70) return true;
  if (scored.event.highCivicValue || scored.event.featured) return true;
  return false;
}

export function resolveBoundaryForWorkspace(workspace: CampaignWorkspace): DistrictBoundaryDefinition | null {
  const scope = workspace.districtScope;
  const fromRegistry = resolveWorkspaceBoundary({
    mode: scope.mode,
    districtCode: scope.districtCode,
    districtBoundarySlug: scope.districtBoundarySlug,
  });
  if (fromRegistry) return fromRegistry;

  if (scope.mode === "county" && workspace.counties.length === 1) {
    return countyBoundary(workspace.counties[0]);
  }
  if (scope.mode === "city" && workspace.cities.length === 1) {
    return cityBoundary(workspace.cities[0], workspace.counties[0]);
  }

  return {
    districtType: scope.mode,
    districtCode: scope.districtCode ?? workspace.slug,
    name: workspace.districtName,
    slug: `workspace-${workspace.slug}`,
    countiesWhole: scope.counties.length ? scope.counties : workspace.counties,
    countiesPartial: [],
    cities: scope.cities.length ? scope.cities : workspace.cities,
    nearCounties: [],
    nearRadiusMiles: 35,
    boundaryPrecision: scope.boundaryPrecision === "full" ? "full" : "county_fallback",
    boundarySource: "workspace_fallback",
  };
}

export function classifyCampaignEvents(events: CivicEvent[], workspace: CampaignWorkspace): CampaignDistrictBreakdown {
  const boundary = resolveBoundaryForWorkspace(workspace);
  const inside: ClassifiedCampaignEvent[] = [];
  const near: ClassifiedCampaignEvent[] = [];
  const statewideHighValue: ClassifiedCampaignEvent[] = [];
  let outsideCount = 0;

  for (const event of events) {
    const scored = scoreEventForCampaign(event);
    if (!boundary) {
      inside.push({ scored, zone: "inside", zoneReason: "No boundary — showing all" });
      continue;
    }

    const { zone, reason } = classifyEventZone(event, boundary);

    if (zone === "inside") {
      inside.push({ scored, zone, zoneReason: reason });
    } else if (zone === "near") {
      near.push({ scored, zone, zoneReason: reason });
    } else {
      outsideCount += 1;
      if (isStatewideHighValue(scored, workspace)) {
        statewideHighValue.push({ scored, zone: "outside", zoneReason: `High-value exception — ${reason}` });
      }
    }
  }

  const sortByPo = (a: ClassifiedCampaignEvent, b: ClassifiedCampaignEvent) =>
    b.scored.politicalOpportunityScore - a.scored.politicalOpportunityScore;

  inside.sort(sortByPo);
  near.sort(sortByPo);
  statewideHighValue.sort(sortByPo);

  const scopeLabel = boundary
    ? boundary.districtType === "statewide"
      ? "All Arkansas"
      : `${boundary.districtCode} · ${boundary.boundaryPrecision === "partial" ? "county + geo pending" : boundary.name}`
    : workspace.districtName;

  return {
    inside,
    near,
    statewideHighValue,
    outsideCount,
    boundary,
    scopeLabel,
    totalEvents: events.length,
  };
}

/** Events visible on dashboard = inside + near + statewide exceptions */
export function dashboardEvents(breakdown: CampaignDistrictBreakdown): ClassifiedCampaignEvent[] {
  return [...breakdown.inside, ...breakdown.near, ...breakdown.statewideHighValue];
}

export function isBoundaryPending(workspace: CampaignWorkspace): boolean {
  const b = resolveBoundaryForWorkspace(workspace);
  return b?.boundaryPrecision === "partial" || workspace.districtScope.boundaryPrecision === "pending";
}

export function boundaryStatusNote(workspace: CampaignWorkspace): string | undefined {
  const b = resolveBoundaryForWorkspace(workspace);
  return b?.boundarySource ?? workspace.districtScope.boundaryNote;
}
