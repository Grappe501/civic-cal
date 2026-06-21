/** County Rollup 2.0 — county is primary; cities feed intelligence upward */

import type { CountyCommunityInstitutionsLayer, SportsHubSnapshot } from "../institutions/types";
import type { CommunityAnchorsSnapshot } from "../institutions/communityAnchorTypes";

export interface CountyDemographicsRollup {
  population?: number | null;
  growthTrend?: string | null;
  ageDistribution?: string | null;
  income?: string | null;
  education?: string | null;
  housing?: string | null;
  raceEthnicity?: string | null;
  employment?: string | null;
  industry?: string | null;
  migration?: string | null;
}

export interface CountyPoliticalRollup {
  sosTurnout?: string | null;
  historicalTurnout?: string | null;
  primaryTurnout?: string | null;
  generalTurnout?: string | null;
  baselineVotes?: number | null;
  voteTargets?: number | null;
  persuasionTargets?: number | null;
  turnoutTargets?: number | null;
  voteDeficit?: number | null;
  projectedVoteGain?: number | null;
}

export interface CountyEventsRollup {
  upcomingCount: number;
  recurring: string[];
  flagship: string[];
  government: string[];
  church: string[];
  sports: string[];
  community: string[];
  festivals: string[];
  parades: string[];
  volunteer: string[];
  foodEvents: string[];
}

export interface CountyInstitutionsRollup {
  churches: string[];
  schools: string[];
  libraries: string[];
  colleges: string[];
  volunteerFireDepartments: string[];
  rotary: string[];
  lions: string[];
  kiwanis: string[];
  farmBureau: string[];
  ffa: string[];
  fourH: string[];
  chambers: string[];
}

export interface CountyMediaRollup {
  newspapers: string[];
  radio: string[];
  facebookPages: string[];
  communityGroups: string[];
  newsletters: string[];
  podcasts: string[];
}

export interface CountyCandidateActivityRollup {
  attendedCount: number;
  skippedCount: number;
  consideringCount: number;
  volunteerActivityNotes: string[];
  eventCoverageNotes: string[];
  presenceMapAvailable: boolean;
  relationshipDensityMapAvailable: boolean;
}

export interface CountyOpportunityAnalysis {
  source: "openai" | "deterministic";
  biggestOpportunity: string;
  biggestRisk: string;
  missingRelationships: string[];
  highValueInstitutionsNotVisited: string[];
  eventsMissingFromCalendar: string[];
  untappedVolunteerOpportunities: string[];
}

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
  /** County Rollup 2.0 static blocks (JSON registry) */
  rollupVersion?: number;
  demographics?: CountyDemographicsRollup;
  political?: CountyPoliticalRollup;
  institutions?: CountyInstitutionsRollup;
  media?: CountyMediaRollup;
  /** City names that feed this county dossier */
  feederCities?: string[];
}

/** Live county view — static dossier + runtime city/event/campaign merge */
export interface CountyRollupView {
  dossier: CountyIntelligenceDossier;
  cities: CityIntelligenceDossier[];
  events: CountyEventsRollup;
  candidateActivity: CountyCandidateActivityRollup;
  opportunity?: CountyOpportunityAnalysis;
  /** Community Institutions Layer 1.0 */
  communityLayer?: CountyCommunityInstitutionsLayer;
  /** Community Anchor Intelligence Engine — Pass 16 */
  communityAnchors?: CommunityAnchorsSnapshot;
  sportsHub?: SportsHubSnapshot;
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
  opportunity?: CountyOpportunityAnalysis;
}

export interface CountyBriefBundle {
  county: string;
  generatedAt: string;
  summary: LocalIntelligenceSummary;
  rollup: CountyRollupView;
}
