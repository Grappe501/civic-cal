export type LaneCoverageStatus = "filled" | "thin" | "missing" | "ready_for_harvest";

export type LaneHarvestPriority = "critical" | "high" | "medium" | "low" | "ongoing";

export interface CalendarLaneDefinition {
  id: string;
  number: number;
  name: string;
  shortName: string;
  phase: number;
  buildOrder: number;
  goal: string;
  sources: string[];
  eventTypes: string[];
  matchPatterns: string[];
  sourceTypes?: string[];
  institutionTypes?: string[];
  expectedPerCounty?: {
    base?: number;
    perCity?: number;
    perSchool?: number;
    perChurch?: number;
    perCollege?: number;
    perVfd?: number;
  };
  harvestPriority: LaneHarvestPriority;
}

export interface LaneCoverageRow {
  laneId: string;
  laneNumber: number;
  shortName: string;
  coveragePercent: number;
  status: LaneCoverageStatus;
  eventsIndexed: number;
  sourcesOnFile: number;
  institutionsTracked: number;
  expectedSlots: number;
  harvestPriority: LaneHarvestPriority;
}

export interface GeoLaneCoverage {
  geoType: "county" | "city";
  county: string;
  city?: string;
  overallCoverage: number;
  phase1Coverage: number;
  lanes: LaneCoverageRow[];
  generatedAt?: string;
}

export interface LaneHarvestPlanItem {
  laneId: string;
  laneName: string;
  county: string;
  city?: string;
  priority: LaneHarvestPriority;
  coveragePercent: number;
  reason: string;
  suggestedCommands: string[];
}

export interface LaneCoverageBundle {
  version: string;
  generatedAt: string;
  counties: GeoLaneCoverage[];
  cities: GeoLaneCoverage[];
}
