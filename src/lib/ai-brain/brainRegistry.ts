/** AI Brain modes and governance rules */

export type AiBrainMode = "public" | "admin" | "campaign";

export type AiBrainToolName =
  | "searchEvents"
  | "searchOrganizations"
  | "searchCities"
  | "searchCounties"
  | "searchCandidates"
  | "searchFeeds"
  | "searchStagedCandidates"
  | "searchCoverageGaps"
  | "getEventDossier"
  | "getCountyDossier"
  | "getCityDossier"
  | "getCandidateBrief"
  | "recommendHarvestTargets"
  | "explainEventPriority"
  | "summarizeCalendarRange"
  | "findMissingSources"
  | "generateResearchTasks"
  | "findMissingCountyFairs";

export const AI_BRAIN_GOVERNANCE = {
  advisesOnly: true,
  humanApproves: ["publishing", "verification", "campaign_actions"],
  neverInventFacts: true,
  requiredAnswerFields: ["basedOn", "sources", "freshness", "confidence", "missing"] as const,
};

export const PUBLIC_SAFE_TOPICS = [
  "things to do",
  "festivals",
  "volunteer opportunities",
  "student service",
  "events by county/city/date",
  "food trucks",
  "races",
  "fairs",
  "school/community events",
] as const;

export const ADMIN_EXAMPLE_PROMPTS = [
  "Why is White County thin?",
  "What feeds should we attach next?",
  "What county fair dates are missing?",
  "Find all events needing source confirmation.",
  "What should we harvest next to grow fastest?",
] as const;

export const CAMPAIGN_EXAMPLE_PROMPTS = [
  "Where should I be today?",
  "What matters this week?",
  "What county am I ignoring?",
  "Which events are worth the trip?",
  "What city has high opportunity but low presence?",
] as const;

export const TOOLS_BY_MODE: Record<AiBrainMode, AiBrainToolName[]> = {
  public: [
    "searchEvents",
    "searchOrganizations",
    "searchCities",
    "searchCounties",
    "getEventDossier",
    "getCountyDossier",
    "getCityDossier",
    "summarizeCalendarRange",
  ],
  admin: [
    "searchEvents",
    "searchOrganizations",
    "searchCities",
    "searchCounties",
    "searchCandidates",
    "searchFeeds",
    "searchStagedCandidates",
    "searchCoverageGaps",
    "getEventDossier",
    "getCountyDossier",
    "getCityDossier",
    "getCandidateBrief",
    "recommendHarvestTargets",
    "explainEventPriority",
    "summarizeCalendarRange",
    "findMissingSources",
    "generateResearchTasks",
    "findMissingCountyFairs",
  ],
  campaign: [
    "searchEvents",
    "searchOrganizations",
    "searchCities",
    "searchCounties",
    "getEventDossier",
    "getCountyDossier",
    "getCityDossier",
    "summarizeCalendarRange",
    "searchCoverageGaps",
    "recommendHarvestTargets",
    "explainEventPriority",
    "generateResearchTasks",
    "findMissingCountyFairs",
  ],
};

export function toolsForMode(mode: AiBrainMode): AiBrainToolName[] {
  return TOOLS_BY_MODE[mode];
}

export function isToolAllowed(mode: AiBrainMode, tool: AiBrainToolName): boolean {
  return TOOLS_BY_MODE[mode].includes(tool);
}
