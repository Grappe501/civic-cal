export type PoliticalPartyLabel = "Democratic" | "Republican" | "Libertarian";

export type PoliticalOrgStatus =
  | "meeting_schedule_public"
  | "page_discovered"
  | "partial"
  | "not_found"
  | "affiliate_indexed";

export interface PoliticalPartyOrganization {
  id: string;
  slug: string;
  name: string;
  partyLabel: PoliticalPartyLabel;
  partySlug: string;
  organization: string;
  county: string;
  entityType: string;
  meetingSchedule?: string | null;
  recurrenceRule?: string | null;
  chairPublic?: string | null;
  electionCommissioner?: string | null;
  venue?: string | null;
  city?: string | null;
  sourceUrl?: string | null;
  sourceLinks: { label: string; url: string }[];
  confidenceScore: number;
  freshnessDate: string;
  status: PoliticalOrgStatus;
  stagedEventCount: number;
  fetchBlocked?: boolean;
  seriesKey: string;
}

export interface CountyInfrastructureEntity {
  key: string;
  label: string;
  found: boolean;
  status: string;
  confidence: number;
  sourceUrl?: string | null;
  meetingSchedule?: string | null;
  organizationSlug?: string | null;
}

export interface CountyInfrastructureCoverage {
  county: string;
  countySlug: string;
  entities: CountyInfrastructureEntity[];
  politicalInfrastructureFound: number;
  politicalInfrastructureTotal: number;
  coveragePercent: number;
  fullInfrastructureNote?: string;
}

export interface CivicPoliticalDensitySummary {
  county: string;
  lines: { label: string; value: string; found: boolean }[];
  coveragePercent: number;
  note: string;
}
