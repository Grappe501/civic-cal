/** City / county local intelligence types — candidate-only, aggregate geography */
export interface CityIntelligenceDossier {
  city: string;
  county: string;
  region: string;
  priorityRank: number;
  population?: number | null;
  demographicsSummary?: string | null;
  ageProfile?: string | null;
  incomeProfile?: string | null;
  employmentProfile?: string | null;
  educationProfile?: string | null;
  majorEmployers?: string[];
  civicInstitutions?: string[];
  churches?: string[];
  schools?: string[];
  recurringEvents?: string[];
  localMedia?: string[];
  politicalNotes?: string | null;
  sosBaselineVotes?: number | null;
  sosTargetVotes?: number | null;
  persuasionGap?: number | null;
  turnoutGap?: number | null;
  opportunityNotes?: string | null;
  confidenceScore: number;
  sourceLinks?: { label: string; url: string; type?: string }[];
}

export interface CountyIntelligenceDossier {
  county: string;
  region: string;
  countySeat?: string | null;
  population?: number | null;
  demographicsSummary?: string | null;
  employmentProfile?: string | null;
  economicDrivers?: string[];
  majorTowns?: string[];
  civicCalendarSources?: string[];
  recurringTraditions?: string[];
  priorSosBaseline?: number | null;
  targetVotes?: number | null;
  winPathNotes?: string | null;
  confidenceScore: number;
  sourceLinks?: { label: string; url: string; type?: string }[];
}

export interface SosElectionTarget {
  geographyType: "statewide" | "county" | "city";
  geographyName: string;
  county?: string;
  baselineVotes: number;
  targetVotes: number;
  notes?: string;
}

export interface CampaignLocalNote {
  id: string;
  workspaceSlug: string;
  city?: string;
  county?: string;
  noteType: string;
  noteText: string;
  visibility: "private" | "internal";
  createdAt: string;
}

export interface CampaignVoteTarget {
  workspaceSlug: string;
  geographyType: "city" | "county" | "statewide";
  geographyName: string;
  baselineVotes: number;
  targetVotes: number;
  currentProjection?: number | null;
  voteGap?: number | null;
  notes?: string | null;
}

export interface LocalIntelligenceSummary {
  source: "openai" | "deterministic";
  whyItMatters: string;
  eventsThatMatter: string[];
  calendarGaps: string[];
  electionContext: string;
  relationshipGuidance: string;
  questionsForLocals: string[];
  confidenceNotes: string;
  missingData: string[];
}
