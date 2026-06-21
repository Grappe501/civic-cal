import type { CivicEvent } from "../types";

export type DistrictType =
  | "statewide"
  | "congressional"
  | "state_senate"
  | "state_house"
  | "county"
  | "city"
  | "school_district";

export type BoundaryPrecision = "full" | "pending" | "partial";

export interface DistrictScope {
  mode: DistrictType;
  districtCode?: string;
  districtBoundarySlug?: string;
  counties: string[];
  cities: string[];
  boundaryPrecision: BoundaryPrecision;
  boundaryNote?: string;
}

export interface DashboardTheme {
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  heroTagline: string;
  logoInitials: string;
  badgeLabel: string;
}

export type PlanStatus =
  | "considering"
  | "attending"
  | "candidate_should_attend"
  | "surrogate_should_attend"
  | "needs_volunteers"
  | "skip"
  | "needs_research";

export interface CampaignWorkspace {
  id?: string;
  slug: string;
  campaignName: string;
  candidateName: string;
  officeSought: string;
  districtType: DistrictType;
  districtName: string;
  dashboardLabel: string;
  counties: string[];
  cities: string[];
  districtScope: DistrictScope;
  dashboardTheme: DashboardTheme;
  notes?: string;
  isActive: boolean;
  accessMode: string;
  googleCalendarStatus?: "not_connected" | "pending_oauth" | "connected";
  mobilizeStatus?: "not_connected" | "pending" | "connected";
}

export type PublicPresenceStatus = "private" | "public";

export interface CampaignEventPlan {
  eventId: string;
  planStatus: PlanStatus;
  candidateAttending: boolean;
  surrogateAttending?: boolean;
  needsVolunteers: boolean;
  volunteerGoal?: number;
  staffingNotes?: string;
  travelNotes?: string;
  updatedAt?: string;
  publicPresenceStatus?: PublicPresenceStatus;
  showCandidateAttending?: boolean;
  showVolunteersNeeded?: boolean;
  showSurrogateAttending?: boolean;
  publicNote?: string;
  volunteerPublicNote?: string;
  candidateColor?: string;
  volunteerColor?: string;
}

export interface ScoredEvent {
  event: CivicEvent;
  layer: string;
  politicalOpportunityScore: number;
  relationshipDensityScore: number;
  candidateUsefulness: "low" | "medium" | "high" | "very_high";
}

export const DISTRICT_TYPE_LABELS: Record<DistrictType, string> = {
  statewide: "Statewide",
  congressional: "Congressional district",
  state_senate: "State Senate district",
  state_house: "State House district",
  county: "County",
  city: "City",
  school_district: "School district",
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  considering: "Considering",
  attending: "Attending",
  candidate_should_attend: "Candidate should attend",
  surrogate_should_attend: "Surrogate should attend",
  needs_volunteers: "Volunteer team needed",
  skip: "Skip",
  needs_research: "Needs research",
};

export const PLAN_STATUS_SHORT: Record<PlanStatus, string> = {
  considering: "Considering",
  attending: "Attending",
  candidate_should_attend: "Candidate",
  surrogate_should_attend: "Surrogate",
  needs_volunteers: "Volunteers",
  skip: "Skip",
  needs_research: "Research",
};
