import type { CivicEvent } from "../types";
import type { CampaignWorkspace } from "./types";
import { classifyCampaignEvents, dashboardEvents, type CampaignDistrictBreakdown } from "./districtBoundaryEngine";

/** @deprecated Use classifyCampaignEvents from districtBoundaryEngine */
export interface DistrictScopeResult {
  events: CivicEvent[];
  totalBeforeFilter: number;
  boundaryPrecision: CampaignWorkspace["districtScope"]["boundaryPrecision"];
  boundaryNote?: string;
  scopeLabel: string;
  breakdown?: CampaignDistrictBreakdown;
}

export function applyDistrictScope(events: CivicEvent[], workspace: CampaignWorkspace): DistrictScopeResult {
  const breakdown = classifyCampaignEvents(events, workspace);
  const visible = dashboardEvents(breakdown);
  return {
    events: visible.map((c) => c.scored.event),
    totalBeforeFilter: breakdown.totalEvents,
    boundaryPrecision: workspace.districtScope.boundaryPrecision,
    boundaryNote: breakdown.boundary?.boundarySource ?? workspace.districtScope.boundaryNote,
    scopeLabel: breakdown.scopeLabel,
    breakdown,
  };
}

export { isBoundaryPending, boundaryStatusNote } from "./districtBoundaryEngine";
export type { CampaignDistrictBreakdown, ClassifiedCampaignEvent, EventDistrictZone } from "./districtBoundaryEngine";

export function districtTypeLabel(type: CampaignWorkspace["districtType"]): string {
  const labels: Record<CampaignWorkspace["districtType"], string> = {
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
