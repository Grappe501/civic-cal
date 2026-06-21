/**
 * Event intelligence assessment types and deterministic fallback.
 * OpenAI scoring runs server-side only (netlify/functions/ai-score-event.js).
 * AI is advisory — never auto-publishes events.
 */

export type CandidateUsefulness = "low" | "medium" | "high" | "very_high";

export interface EventIntelligenceInput {
  title: string;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  county?: string | null;
  eventDate?: string | null;
  startAt?: string | null;
  venueName?: string | null;
  address?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  sourceType?: string | null;
  intelligenceLayer?: string | null;
  isRecurring?: boolean;
  isPublicGovernmentMeeting?: boolean;
  notes?: string | null;
  feedback?: EventFeedbackSummary[];
}

export interface EventFeedbackSummary {
  crowdSizeEstimate?: number | null;
  traditionYears?: number | null;
  isGoodForCandidates?: boolean | null;
  whyItMatters?: string | null;
  localNotes?: string | null;
  correctionNotes?: string | null;
}

export interface EventIntelligenceAssessment {
  isLikelyReal: boolean;
  verificationQuestions: string[];
  estimatedCrowdMin: number | null;
  estimatedCrowdMax: number | null;
  traditionStrength: number;
  politicalOpportunityScore: number;
  relationshipDensityScore: number;
  candidateUsefulness: CandidateUsefulness;
  bestFor: string[];
  whyItMatters: string;
  localIntelNeeded: string[];
  riskFlags: string[];
  publicSummary: string;
  campaignNotes: string;
  confidenceScore: number;
  verificationStatus: "pending" | "needs_verification" | "verified" | "rejected";
  source: "openai" | "deterministic_fallback";
  model?: string;
}

const SPAM_TERMS = /\b(casino|porn|xxx|escort|crypto pump|mlm)\b/i;

function hasDate(input: EventIntelligenceInput): boolean {
  return Boolean(input.eventDate || input.startAt);
}

function hasLocation(input: EventIntelligenceInput): boolean {
  return Boolean(input.city || input.county || input.venueName || input.address);
}

function crowdFromFeedback(feedback: EventFeedbackSummary[] = []): { min: number | null; max: number | null } {
  const crowds = feedback.map((f) => f.crowdSizeEstimate).filter((n): n is number => typeof n === "number" && n > 0);
  if (!crowds.length) return { min: null, max: null };
  const avg = crowds.reduce((a, b) => a + b, 0) / crowds.length;
  return { min: Math.round(avg * 0.7), max: Math.round(avg * 1.3) };
}

function traditionFromFeedback(feedback: EventFeedbackSummary[] = []): number {
  const years = feedback.map((f) => f.traditionYears).filter((n): n is number => typeof n === "number" && n > 0);
  if (!years.length) return 0;
  const max = Math.max(...years);
  if (max >= 50) return 95;
  if (max >= 25) return 85;
  if (max >= 10) return 70;
  if (max >= 5) return 55;
  return 40;
}

/** Deterministic fallback when OPENAI_API_KEY is unavailable. */
export function buildDeterministicAssessment(input: EventIntelligenceInput): EventIntelligenceAssessment {
  const text = `${input.title} ${input.description ?? ""} ${input.notes ?? ""}`.toLowerCase();
  const riskFlags: string[] = [];
  const verificationQuestions: string[] = [];
  const localIntelNeeded: string[] = [];

  if (!hasDate(input)) {
    riskFlags.push("missing_date");
    verificationQuestions.push("What is the confirmed date and start time?");
    localIntelNeeded.push("Confirm event date from organizer or public listing");
  }
  if (!hasLocation(input)) {
    riskFlags.push("missing_location");
    verificationQuestions.push("Where exactly does this event take place?");
    localIntelNeeded.push("Venue name and address");
  }
  if (!input.sourceUrl && !input.sourceName) {
    riskFlags.push("no_public_source");
    localIntelNeeded.push("Link to official site, parish bulletin, or public announcement");
  }
  if (SPAM_TERMS.test(text)) riskFlags.push("suspicious_content");

  const { politicalOpportunityScore, relationshipDensityScore } = scoreFromHeuristics(input, text);
  const crowd = crowdFromFeedback(input.feedback);
  const traditionStrength = Math.max(traditionFromFeedback(input.feedback), input.isRecurring ? 45 : 0);

  let estimatedCrowdMin = crowd.min;
  let estimatedCrowdMax = crowd.max;
  if (estimatedCrowdMin == null) {
    if (/fair|festival|parade|homecoming|spaghetti|fish fry/.test(text)) {
      estimatedCrowdMin = 500;
      estimatedCrowdMax = 5000;
    } else if (/rotary|lions|chamber|quorum court|city council/.test(text)) {
      estimatedCrowdMin = 25;
      estimatedCrowdMax = 300;
    }
  }

  const candidateUsefulness = usefulnessFromScores(politicalOpportunityScore, relationshipDensityScore);
  const isLikelyReal = riskFlags.filter((f) => f !== "no_public_source").length < 2 && !SPAM_TERMS.test(text);

  const whyFromFeedback = input.feedback?.find((f) => f.whyItMatters)?.whyItMatters;
  const whyItMatters =
    whyFromFeedback ||
    (input.isPublicGovernmentMeeting
      ? "Public government meeting — civic accountability touchpoint."
      : relationshipDensityScore >= 80
        ? "High relationship density — strong place to meet connected local leaders."
        : politicalOpportunityScore >= 75
          ? "Strong community gathering — good visibility for candidates and organizers."
          : "Community event — verify details before prioritizing.");

  const bestFor: string[] = [];
  if (candidateUsefulness !== "low") bestFor.push("candidate");
  if (/volunteer|fundraiser|fair|festival/.test(text)) bestFor.push("volunteers");
  if (input.isPublicGovernmentMeeting || input.intelligenceLayer === "government") bestFor.push("county leaders");
  if (/school|homecoming|pta|pto|ffa/.test(text)) bestFor.push("school board watchers");

  let confidenceScore = 50;
  if (hasDate(input) && hasLocation(input)) confidenceScore += 20;
  if (input.sourceUrl) confidenceScore += 15;
  if (input.feedback?.length) confidenceScore += 10;
  if (riskFlags.length) confidenceScore -= riskFlags.length * 8;
  confidenceScore = Math.max(10, Math.min(95, confidenceScore));

  const verificationStatus = isLikelyReal
    ? hasDate(input) && hasLocation(input)
      ? "pending"
      : "needs_verification"
    : "needs_verification";

  return {
    isLikelyReal,
    verificationQuestions,
    estimatedCrowdMin,
    estimatedCrowdMax,
    traditionStrength,
    politicalOpportunityScore,
    relationshipDensityScore,
    candidateUsefulness,
    bestFor,
    whyItMatters,
    localIntelNeeded,
    riskFlags,
    publicSummary: `${input.title}${input.county ? ` in ${input.county} County` : ""} — ${whyItMatters.split(".")[0]}.`,
    campaignNotes: `[Deterministic] PO ${politicalOpportunityScore}, RD ${relationshipDensityScore}. ${localIntelNeeded.length ? `Needs: ${localIntelNeeded.join("; ")}` : "Basic fields present."}`,
    confidenceScore,
    verificationStatus,
    source: "deterministic_fallback",
  };
}

function scoreFromHeuristics(input: EventIntelligenceInput, text: string): { politicalOpportunityScore: number; relationshipDensityScore: number } {
  let po = 45;
  let rd = 50;

  const layer = input.intelligenceLayer;
  if (layer === "community_church") {
    po += 30;
    rd += 35;
  } else if (layer === "community_identity") {
    po += 28;
    rd += 15;
  } else if (layer === "school_ecosystem") {
    po += 24;
    rd += 25;
  } else if (layer === "relationship") {
    po += 18;
    rd += 38;
  } else if (layer === "government") {
    po += 16;
    rd += 30;
  }

  if (/spaghetti|catholic point|fish fry|brisket|bbq dinner/.test(text)) {
    po += 25;
    rd += 30;
  }
  if (/rotary|farm bureau|vfw|legion|chamber/.test(text)) {
    rd += 25;
  }
  if (/fair|festival|parade|watermelon|tomato|peach/.test(text)) po += 20;
  if (/homecoming|rivalry|ffa|4-h/.test(text)) {
    po += 18;
    rd += 15;
  }
  if (input.isRecurring) po += 8;

  if (input.feedback?.some((f) => f.isGoodForCandidates)) {
    po += 12;
    rd += 8;
  }

  return {
    politicalOpportunityScore: Math.max(0, Math.min(100, po)),
    relationshipDensityScore: Math.max(0, Math.min(100, rd)),
  };
}

function usefulnessFromScores(po: number, rd: number): CandidateUsefulness {
  const combined = po * 0.45 + rd * 0.55;
  if (combined >= 85) return "very_high";
  if (combined >= 70) return "high";
  if (combined >= 50) return "medium";
  return "low";
}

export function parseOpenAiAssessment(raw: unknown, fallback: EventIntelligenceAssessment): EventIntelligenceAssessment {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  return {
    isLikelyReal: typeof o.isLikelyReal === "boolean" ? o.isLikelyReal : fallback.isLikelyReal,
    verificationQuestions: Array.isArray(o.verificationQuestions) ? o.verificationQuestions.map(String) : fallback.verificationQuestions,
    estimatedCrowdMin: typeof o.estimatedCrowdMin === "number" ? o.estimatedCrowdMin : fallback.estimatedCrowdMin,
    estimatedCrowdMax: typeof o.estimatedCrowdMax === "number" ? o.estimatedCrowdMax : fallback.estimatedCrowdMax,
    traditionStrength: typeof o.traditionStrength === "number" ? o.traditionStrength : fallback.traditionStrength,
    politicalOpportunityScore:
      typeof o.politicalOpportunityScore === "number" ? o.politicalOpportunityScore : fallback.politicalOpportunityScore,
    relationshipDensityScore:
      typeof o.relationshipDensityScore === "number" ? o.relationshipDensityScore : fallback.relationshipDensityScore,
    candidateUsefulness: (["low", "medium", "high", "very_high"] as const).includes(o.candidateUsefulness as CandidateUsefulness)
      ? (o.candidateUsefulness as CandidateUsefulness)
      : fallback.candidateUsefulness,
    bestFor: Array.isArray(o.bestFor) ? o.bestFor.map(String) : fallback.bestFor,
    whyItMatters: typeof o.whyItMatters === "string" ? o.whyItMatters : fallback.whyItMatters,
    localIntelNeeded: Array.isArray(o.localIntelNeeded) ? o.localIntelNeeded.map(String) : fallback.localIntelNeeded,
    riskFlags: Array.isArray(o.riskFlags) ? o.riskFlags.map(String) : fallback.riskFlags,
    publicSummary: typeof o.publicSummary === "string" ? o.publicSummary : fallback.publicSummary,
    campaignNotes: typeof o.campaignNotes === "string" ? o.campaignNotes : fallback.campaignNotes,
    confidenceScore: typeof o.confidenceScore === "number" ? o.confidenceScore : fallback.confidenceScore,
    verificationStatus: fallback.verificationStatus,
    source: "openai",
  };
}
