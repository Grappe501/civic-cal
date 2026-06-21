import type { ProfileEntityType } from "../profiles/profileTypes";

export type GapSeverity = "critical" | "high" | "medium";

export type GapKind =
  | "church_events"
  | "school_events"
  | "traditions"
  | "institution_feeds"
  | "volunteer"
  | "overall_sparse";

export interface InstitutionCounts {
  churches: number;
  schools: number;
  colleges: number;
  vfds: number;
  libraries: number;
  extensionOffices: number;
  homemakerClubs: number;
  civicOrgs: number;
  chambers: number;
  total: number;
}

export interface EventCounts {
  total: number;
  thisMonth: number;
  recurring: number;
  churchTagged: number;
  schoolTagged: number;
  festivalParade: number;
  sports: number;
  food: number;
  institutionsWithEvents: number;
}

export interface CountyDensitySnapshot {
  county: string;
  citiesInCounty: number;
  institutions: InstitutionCounts;
  events: EventCounts;
  recurringTraditions: number;
  volunteerOpportunities: number;
  sourceFeedsDiscovered: number;
  projectedFutureEvents: number;
  coverageScore: number;
  gaps: CoverageGap[];
}

export interface CoverageGap {
  kind: GapKind;
  severity: GapSeverity;
  message: string;
  known?: number;
  observed?: number;
  suggestedAction: string;
}

export interface InstitutionEventProjection {
  id: string;
  title: string;
  county: string;
  city: string | null;
  institutionId: string;
  institutionType: ProfileEntityType | "extension" | "vfd" | "library" | "chamber";
  institutionName: string;
  recurrence: "annual" | "monthly" | "seasonal" | "weekly";
  typicalMonth?: string | null;
  harvestTarget: boolean;
  projectionStatus: "scaffold" | "verified_tradition" | "institution_verified";
  sourceUrl?: string | null;
  notes: string;
}

export interface DensityEngineReport {
  generatedAt: string;
  totalProjectedFutureEvents: number;
  counties: CountyDensitySnapshot[];
  bottomCounties: CountyDensitySnapshot[];
  topGaps: CoverageGap[];
}
