import type { CivicEvent } from "../types";
import type { CampaignWorkspace } from "../campaigns/types";
import type { GapAnalysisResult } from "../campaigns/calendarGapAnalyzer";

export interface StrategicEventRecommendation {
  eventId: string;
  title: string;
  city?: string;
  county?: string;
  eventDate?: string;
  whyItMatters: string;
  suggestedRole: "candidate" | "surrogate" | "volunteers" | "research";
  poScore?: number;
  rdScore?: number;
  zone?: string;
}

export interface StrategicSearchAnswer {
  source: "openai" | "deterministic";
  query: string;
  summary: string;
  recommendedEvents: StrategicEventRecommendation[];
  calendarGaps: string[];
  suggestedRoles: string[];
  risks: string[];
  localIntelNeeded: string[];
  nextActions: string[];
  gapAnalysis?: Partial<GapAnalysisResult>;
}

export interface StrategicSearchContext {
  workspace: CampaignWorkspace;
  events: CivicEvent[];
  gapSummary?: string[];
  queryIntent?: string;
}

function inferIntent(query: string): string {
  const q = query.toLowerCase();
  if (/weekend|this week|next week/.test(q)) return "weekend";
  if (/gap|missing|no event|empty/.test(q)) return "gaps";
  if (/volunteer|deploy|staff/.test(q)) return "volunteers";
  if (/church|fish fry|spaghetti|dinner/.test(q)) return "church";
  if (/high.?rd|relationship|density/.test(q)) return "rd";
  if (/worth the trip|outside|statewide/.test(q)) return "worth_trip";
  if (/county|no presence/.test(q)) return "county_coverage";
  if (/school board|candidate/.test(q)) return "school_gov";
  if (/100\+|crowd|people|attendance/.test(q)) return "crowd";
  if (/early voting|election/.test(q)) return "election";
  return "general";
}

function scoreEventForQuery(event: CivicEvent, intent: string): number {
  const text = `${event.title} ${event.description || ""} ${event.category}`.toLowerCase();
  let score = (event.relationshipDensityScore ?? 50) * 0.5 + (event.highCivicValue ? 80 : 50) * 0.3;
  if (intent === "church" && /church|fish fry|spaghetti|bbq|dinner/.test(text)) score += 40;
  if (intent === "volunteers" && /fair|festival|parade|homecoming/.test(text)) score += 25;
  if (intent === "school_gov" && /school board|city council|quorum/.test(text)) score += 35;
  if (intent === "rd" && (event.relationshipDensityScore ?? 0) >= 75) score += 30;
  if (intent === "crowd" && /fair|festival|homecoming|rivalry/.test(text)) score += 25;
  return score;
}

export function deterministicStrategicSearch(
  queryText: string,
  context: StrategicSearchContext,
): StrategicSearchAnswer {
  const intent = inferIntent(queryText);
  const { workspace, events, gapSummary = [] } = context;

  const scoped = events.filter((e) => {
    if (workspace.districtType === "statewide") return true;
    const counties = workspace.districtScope.counties;
    if (counties.length && e.county) return counties.includes(e.county);
    return true;
  });

  const ranked = [...scoped]
    .map((e) => ({ event: e, score: scoreEventForQuery(e, intent) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const recommendedEvents: StrategicEventRecommendation[] = ranked.map(({ event, score }) => ({
    eventId: event.id,
    title: event.title,
    city: event.city ?? undefined,
    county: event.county,
    eventDate: event.startAt?.slice(0, 10),
    whyItMatters: buildWhy(event, intent, score),
    suggestedRole: suggestRole(intent, event),
    poScore: event.highCivicValue ? 85 : Math.round(score),
    rdScore: event.relationshipDensityScore ?? undefined,
  }));

  const calendarGaps = gapSummary.length
    ? gapSummary
    : intent === "gaps"
      ? ["Run gap analysis on your planned events to find empty days and counties."]
      : [];

  const risks = ["Deterministic mode — connect OPENAI_API_KEY for deeper strategic reasoning."];
  if (intent === "worth_trip") risks.push("Outside-district events need travel justification.");

  const localIntelNeeded = recommendedEvents.slice(0, 3).map(
    (e) => `Verify crowd size and candidate fit for ${e.title} in ${e.city || e.county || "AR"}`,
  );

  const nextActions = [
    recommendedEvents[0]
      ? `Mark "${recommendedEvents[0].title}" as candidate should attend and verify with local intel.`
      : "Expand harvest coverage or submit events for your district.",
    "Review calendar gaps in the Strategy Panel.",
    "Toggle public presence when ready to show voters where you'll be.",
  ];

  return {
    source: "deterministic",
    query: queryText,
    summary: buildSummary(queryText, intent, workspace, recommendedEvents.length),
    recommendedEvents,
    calendarGaps,
    suggestedRoles: roleSuggestions(intent),
    risks,
    localIntelNeeded,
    nextActions,
  };
}

function buildWhy(event: CivicEvent, intent: string, score: number): string {
  if (intent === "church") return "High relationship-density community meal — locals decide trust here.";
  if (intent === "volunteers") return "Public crowd event where volunteer deployment builds visible presence.";
  if (intent === "rd") return `Relationship density score ${event.relationshipDensityScore ?? "—"} — small-room politics.`;
  if (intent === "school_gov") return "Government or school governance — policy credibility and visibility.";
  if (score >= 70) return "Strong PO/RD combination for this district scope.";
  return "Matches query filters for your workspace scope.";
}

function suggestRole(intent: string, event: CivicEvent): StrategicEventRecommendation["suggestedRole"] {
  if (intent === "volunteers") return "volunteers";
  if (/fair|festival|parade/.test(`${event.title} ${event.category}`.toLowerCase())) return "volunteers";
  if ((event.relationshipDensityScore ?? 0) >= 80) return "candidate";
  return "candidate";
}

function roleSuggestions(intent: string): string[] {
  switch (intent) {
    case "volunteers":
      return ["Deploy volunteer team", "Candidate drop-by if schedule allows"];
    case "gaps":
      return ["Fill empty calendar days", "Assign surrogate to near-district events"];
    case "worth_trip":
      return ["Candidate travel", "Surrogate with local intro"];
    default:
      return ["Candidate should attend", "Surrogate if candidate unavailable", "Volunteers for visibility"];
  }
}

function buildSummary(query: string, intent: string, workspace: CampaignWorkspace, count: number): string {
  return `Strategic scan for ${workspace.candidateName} (${intent} intent): ${count} events ranked in ${workspace.districtName}. Query: "${query.slice(0, 120)}"`;
}
