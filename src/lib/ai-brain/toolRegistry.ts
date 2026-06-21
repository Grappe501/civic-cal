import type { AiBrainToolName } from "./brainRegistry";

export type AiBrainToolDef = {
  name: AiBrainToolName;
  description: string;
  adminOnly?: boolean;
  campaignOnly?: boolean;
};

export const AI_BRAIN_TOOLS: AiBrainToolDef[] = [
  { name: "searchEvents", description: "Search indexed public events by text, county, or city." },
  { name: "searchOrganizations", description: "Search churches, schools, and community organizations." },
  { name: "searchCities", description: "Search cities by name with event counts." },
  { name: "searchCounties", description: "Search counties; optionally filter to thin coverage." },
  { name: "searchCandidates", description: "Search campaign candidate workspaces.", adminOnly: true },
  { name: "searchFeeds", description: "Search county feed attachment coverage.", adminOnly: true },
  { name: "searchStagedCandidates", description: "Search staged ingestion awaiting approval.", adminOnly: true },
  { name: "searchCoverageGaps", description: "Find thin counties and missing feed attachment." },
  { name: "getEventDossier", description: "Detailed dossier for one event by slug or title." },
  { name: "getCountyDossier", description: "County event density, feeds, and sample events." },
  { name: "getCityDossier", description: "City event list and density." },
  { name: "getCandidateBrief", description: "Campaign workspace brief by slug.", adminOnly: true },
  { name: "recommendHarvestTargets", description: "Rank counties for next harvest pass." },
  { name: "explainEventPriority", description: "Explain index-level factors for an event." },
  { name: "summarizeCalendarRange", description: "Summarize events in a date window." },
  { name: "findMissingSources", description: "List events without source URLs.", adminOnly: true },
  { name: "generateResearchTasks", description: "List open research tasks for human review." },
  { name: "findMissingCountyFairs", description: "Report all 75 county fairs — dates verified or not." },
];

export function getToolDef(name: AiBrainToolName): AiBrainToolDef | undefined {
  return AI_BRAIN_TOOLS.find((t) => t.name === name);
}

export function listToolNames(): AiBrainToolName[] {
  return AI_BRAIN_TOOLS.map((t) => t.name);
}
