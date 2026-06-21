import type { EventCategory } from "../types";

export interface OpportunityInput {
  title: string;
  category?: EventCategory | string;
  civicValue?: string;
  county?: string;
  isRecurringAnnual?: boolean;
  isPublicGovernmentMeeting?: boolean;
  candidateRelevant?: boolean;
  description?: string;
  reviewStatus?: string;
}

/**
 * Candidate opportunity score — where should leaders be?
 * Center Ridge Catholic Point spaghetti ≈ 95+; city council ≈ high civic even if small crowd.
 */
export function scoreEventOpportunity(input: OpportunityInput): number {
  let score = 40;
  const text = `${input.title} ${input.description ?? ""}`.toLowerCase();
  const cat = String(input.category ?? "");

  if (cat === "civic_meeting" || input.isPublicGovernmentMeeting) score += 35;
  if (cat === "faith_meal") score += 15;
  if (input.civicValue === "very_high") score += 25;
  else if (input.civicValue === "high") score += 15;

  if (/spaghetti|catholic point|center ridge|st\. joseph/.test(text)) score += 45;
  if (/annual|tradition|1929|thousands/.test(text)) score += 20;
  if (/bbq|brisket|fish fry/.test(text)) score += 12;
  if (/festival|fair|parade/.test(text)) score += 10;
  if (/school board|quorum court|city council|planning commission/.test(text)) score += 30;
  if (/rivalry|football|basketball/.test(text)) score += 8;
  if (input.isRecurringAnnual) score += 10;
  if (input.candidateRelevant) score += 8;
  if (input.reviewStatus === "needs_verification") score -= 15;
  if (input.reviewStatus === "verified_flagship") score += 5;

  return Math.max(0, Math.min(100, score));
}

export function civicValueLabel(score: number): string {
  if (score >= 85) return "very_high";
  if (score >= 65) return "high";
  if (score >= 45) return "medium";
  return "monitor";
}
