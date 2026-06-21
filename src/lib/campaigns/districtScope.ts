import type { CivicEvent } from "../types";
import type { CampaignWorkspace, DistrictScope, DistrictType } from "./types";

export interface DistrictScopeResult {
  events: CivicEvent[];
  totalBeforeFilter: number;
  boundaryPrecision: DistrictScope["boundaryPrecision"];
  boundaryNote?: string;
  scopeLabel: string;
}

function matchCounty(event: CivicEvent, counties: string[]): boolean {
  if (!counties.length) return true;
  return counties.some((c) => c.toLowerCase() === event.county?.toLowerCase());
}

function matchCity(event: CivicEvent, cities: string[]): boolean {
  if (!cities.length) return true;
  return cities.some((c) => event.city?.toLowerCase().includes(c.toLowerCase()));
}

/**
 * Filter events by campaign district scope.
 * Statewide with empty counties = all Arkansas events.
 * Congressional / senate / house use placeholder counties until GIS pass.
 */
export function applyDistrictScope(events: CivicEvent[], workspace: CampaignWorkspace): DistrictScopeResult {
  const scope = workspace.districtScope;
  const totalBeforeFilter = events.length;
  let filtered = events;
  let scopeLabel = workspace.districtName;

  switch (scope.mode) {
    case "statewide":
      if (scope.counties.length === 0 && scope.cities.length === 0) {
        scopeLabel = "All Arkansas";
        filtered = events;
      } else {
        filtered = events.filter((e) => matchCounty(e, scope.counties) || matchCity(e, scope.cities));
      }
      break;

    case "congressional":
    case "state_senate":
    case "state_house":
      filtered = events.filter((e) => {
        const countyOk = scope.counties.length ? matchCounty(e, scope.counties) : true;
        const cityOk = scope.cities.length ? matchCity(e, scope.cities) : true;
        if (scope.counties.length && scope.cities.length) return countyOk && cityOk;
        if (scope.counties.length) return countyOk;
        if (scope.cities.length) return cityOk;
        return countyOk;
      });
      scopeLabel = scope.districtCode
        ? `${scope.districtCode} (placeholder counties)`
        : `${workspace.districtName} (placeholder)`;
      break;

    case "county":
      filtered = events.filter((e) => matchCounty(e, scope.counties.length ? scope.counties : workspace.counties));
      break;

    case "city":
      filtered = events.filter((e) => matchCity(e, scope.cities.length ? scope.cities : workspace.cities));
      break;

    case "school_district":
      filtered = events.filter(
        (e) =>
          matchCounty(e, scope.counties) &&
          (scope.cities.length === 0 || matchCity(e, scope.cities) || e.category === "school"),
      );
      scopeLabel = `${workspace.districtName} (school district placeholder)`;
      break;

    default:
      filtered = events;
  }

  return {
    events: filtered,
    totalBeforeFilter,
    boundaryPrecision: scope.boundaryPrecision,
    boundaryNote: scope.boundaryNote,
    scopeLabel,
  };
}

export function isBoundaryPending(workspace: CampaignWorkspace): boolean {
  return workspace.districtScope.boundaryPrecision === "pending";
}

export function districtTypeLabel(type: DistrictType): string {
  const labels: Record<DistrictType, string> = {
    statewide: "Statewide",
    congressional: "Congressional",
    state_senate: "State Senate",
    state_house: "State House",
    county: "County",
    city: "City",
    school_district: "School district",
  };
  return labels[type] ?? type;
}
