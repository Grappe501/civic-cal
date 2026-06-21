import type { CivicEvent } from "../types";
import type {
  EventDossierBundle,
  EventIntelligenceDossier,
  EventResearchTask,
} from "../intelligence/eventDossierTypes";
import { DEFAULT_RESEARCH_TASKS } from "../intelligence/eventDossierTypes";
import { scoreEventForCampaign } from "../campaigns/eventIntel";

export interface DossierResearchInput {
  event: CivicEvent;
  feedback?: {
    crowdSizeEstimate?: number;
    traditionYears?: number;
    whyItMatters?: string;
    localNotes?: string;
    isGoodForCandidates?: boolean;
  }[];
  existingSources?: { label: string; url: string; type?: string }[];
}

export interface AiDossierResearchResult {
  dossier: EventIntelligenceDossier;
  tasks: EventResearchTask[];
  source: "openai" | "deterministic";
}

function inferEventFormat(event: CivicEvent): string | null {
  const t = `${event.title} ${event.description ?? ""}`.toLowerCase();
  if (/city council|school board|quorum court/.test(t)) return "formal_meeting";
  if (/fish fry|spaghetti|dinner|bbq|brisket/.test(t)) return "handshake_meal";
  if (/fair|festival|parade/.test(t)) return "walk_around";
  if (/forum|town hall|debate/.test(t)) return "speech_event";
  if (/booth|vendor/.test(t)) return "booth_event";
  return null;
}

function inferWhyItMatters(event: CivicEvent): string {
  const scored = scoreEventForCampaign(event);
  const parts = [
    `${event.title} scores PO ${scored.politicalOpportunityScore} and RD ${scored.relationshipDensityScore} for civic outreach.`,
  ];
  if (event.isPublicGovernmentMeeting) parts.push("Public government meeting — transparency and access matter.");
  if (event.highCivicValue) parts.push("Flagged as high civic value in the Arkansas calendar.");
  if (event.candidateRelevant) parts.push("Marked candidate-relevant by organizers or reviewers.");
  return parts.join(" ");
}

function inferCandidateGuidance(event: CivicEvent, format: string | null): string {
  if (format === "handshake_meal") {
    return "Arrive early, eat with locals, stay for introductions — this is relationship politics, not a speech.";
  }
  if (format === "formal_meeting") {
    return "Observe protocol; public comment windows may exist — confirm agenda in advance.";
  }
  if (format === "walk_around") {
    return "Walk the grounds, visit booths, prioritize organizers and long-time attendees.";
  }
  if (format === "speech_event") {
    return "Confirm speaking slot rules; respect time limits and local moderators.";
  }
  return `Confirm with a local contact in ${event.city || event.county || "the area"} before treating this as a campaign stop.`;
}

/** Deterministic dossier — never invents facts; flags unknowns for research. */
export function buildDeterministicDossier(input: DossierResearchInput): AiDossierResearchResult {
  const { event, feedback = [], existingSources = [] } = input;
  const format = inferEventFormat(event);
  const unanswered = DEFAULT_RESEARCH_TASKS.map((t) => t.taskLabel);

  const crowdEstimates = feedback.map((f) => f.crowdSizeEstimate).filter((n): n is number => typeof n === "number");
  const traditionYears = feedback.map((f) => f.traditionYears).filter((n): n is number => typeof n === "number");
  const whyFeedback = feedback.map((f) => f.whyItMatters).filter(Boolean);

  const sourceLinks = [
    ...existingSources.map((s) => ({
      type: (s.type || "other") as string,
      label: s.label,
      url: s.url,
      trust: "medium" as const,
    })),
    ...(event.websiteUrl
      ? [{ type: "official_event_site", label: "Event website", url: event.websiteUrl, trust: "medium" as const }]
      : []),
  ];

  const confirmed: string[] = [];
  if (event.hostOrganization) confirmed.push(`Host listed: ${event.hostOrganization}`);
  if (event.locationName) confirmed.push(`Venue: ${event.locationName}`);
  if (event.isFamilyFriendly) confirmed.push("Marked family-friendly in calendar data");

  const inferences: string[] = [];
  if (format) inferences.push(`Likely event format: ${format.replace(/_/g, " ")} (from title/category — verify locally)`);
  if (event.isRecurring) inferences.push("Event appears recurring — confirm annual pattern with a local source");

  const dossier: EventIntelligenceDossier = {
    eventId: event.id,
    hostOrganization: event.hostOrganization ?? null,
    hostContacts: [],
    officialWebsite: event.websiteUrl ?? null,
    socialLinks: [],
    sourceLinks,
    ticketCost: event.isFree === false ? null : event.isFree ? "Free (per calendar listing)" : null,
    familyFriendly: event.isFamilyFriendly ?? null,
    expectedAttendanceMin: crowdEstimates.length ? Math.round(Math.min(...crowdEstimates) * 0.8) : null,
    expectedAttendanceMax: crowdEstimates.length ? Math.round(Math.max(...crowdEstimates) * 1.2) : null,
    yearsRunning: traditionYears.length ? Math.max(...traditionYears) : null,
    historicalNotes: whyFeedback.join(" ") || null,
    recurringPattern: event.isRecurring ? "Recurring (pattern unverified)" : null,
    candidateGuidance: inferCandidateGuidance(event, format),
    volunteerGuidance: "Confirm volunteer roles and check-in with host before deploying a team.",
    localCustoms: feedback.map((f) => f.localNotes).filter(Boolean).join(" ") || null,
    eventFormat: format,
    unansweredQuestions: unanswered,
    confirmedFacts: confirmed,
    likelyInferences: inferences,
    verificationStatus: "needs_review",
    confidenceScore: sourceLinks.length > 0 ? 25 : 10,
  };

  const tasks: EventResearchTask[] = DEFAULT_RESEARCH_TASKS.map((t) => ({
    eventId: event.id,
    taskType: t.taskType,
    taskLabel: t.taskLabel,
    status: "open",
  }));

  return {
    dossier,
    tasks,
    source: "deterministic",
  };
}

export function buildDossierBundle(event: CivicEvent, stored?: EventDossierBundle | null): EventDossierBundle {
  if (stored?.dossier) return stored;
  const built = buildDeterministicDossier({ event });
  return {
    dossier: built.dossier,
    tasks: built.tasks,
    source: "deterministic",
  };
}

export function dossierMiniSummary(dossier: EventIntelligenceDossier): {
  crowdRange: string | null;
  arrival: string | null;
  parking: boolean;
  accessibility: boolean;
  format: string | null;
  guidance: string | null;
} {
  const crowdRange =
    dossier.expectedAttendanceMin != null && dossier.expectedAttendanceMax != null
      ? `${dossier.expectedAttendanceMin}–${dossier.expectedAttendanceMax}`
      : null;
  return {
    crowdRange,
    arrival: dossier.bestTimeToArrive || dossier.arrivalAdvice || null,
    parking: Boolean(dossier.parkingInfo),
    accessibility: Boolean(dossier.accessibilityInfo),
    format: dossier.eventFormat ?? null,
    guidance: dossier.candidateGuidance ?? null,
  };
}

export function whyEventMatters(event: CivicEvent): string {
  return inferWhyItMatters(event);
}
