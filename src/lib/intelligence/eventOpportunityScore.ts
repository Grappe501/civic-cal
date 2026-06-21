import type { IntelligenceLayer } from "./eventLayers";
import { inferIntelligenceLayer } from "./eventLayers";
import { scoreRelationshipDensity } from "./relationshipDensityScore";

export interface OpportunityInput {
  title: string;
  category?: string;
  civicValue?: string;
  county?: string;
  intelligenceLayer?: IntelligenceLayer;
  isRecurringAnnual?: boolean;
  isPublicGovernmentMeeting?: boolean;
  candidateRelevant?: boolean;
  description?: string;
  reviewStatus?: string;
  typicalAttendanceBand?: "small" | "medium" | "large" | "massive";
}

/** Political opportunity — where should leaders be (breadth + civic weight)? */
export function scoreEventOpportunity(input: OpportunityInput): number {
  let score = 40;
  const text = `${input.title} ${input.description ?? ""}`.toLowerCase();
  const layer = input.intelligenceLayer ?? inferIntelligenceLayer(text, input.category);

  switch (layer) {
    case "community_identity":
      score += 28;
      break;
    case "community_church":
      score += 32;
      break;
    case "school_ecosystem":
      score += 26;
      break;
    case "relationship":
      score += 22;
      break;
    case "government":
      score += 18;
      break;
  }

  if (input.civicValue === "very_high") score += 20;
  else if (input.civicValue === "high") score += 12;

  if (/spaghetti|catholic point|center ridge|st\. joseph/.test(text)) score += 40;
  if (/toad suck|watermelon festival|pink tomato|peach festival|duck gumbo/.test(text)) score += 25;
  if (/annual|tradition|1929|thousands/.test(text)) score += 15;
  if (/rivalry|homecoming/.test(text)) score += 18;
  if (/farm bureau|ffa|4-h|volunteer fire|extension/.test(text)) score += 14;
  if (input.isRecurringAnnual) score += 8;
  if (input.reviewStatus === "needs_verification") score -= 12;
  if (input.reviewStatus === "verified_flagship") score += 5;

  return Math.max(0, Math.min(100, score));
}

export function scoreEventIntelligence(input: OpportunityInput): {
  politicalOpportunityScore: number;
  relationshipDensityScore: number;
} {
  return {
    politicalOpportunityScore: scoreEventOpportunity(input),
    relationshipDensityScore: scoreRelationshipDensity({
      title: input.title,
      description: input.description,
      category: input.category,
      intelligenceLayer: input.intelligenceLayer,
      typicalAttendanceBand: input.typicalAttendanceBand,
      isRecurringTradition: input.isRecurringAnnual,
    }),
  };
}

export function civicValueLabel(score: number): string {
  if (score >= 85) return "very_high";
  if (score >= 65) return "high";
  if (score >= 45) return "medium";
  return "monitor";
}
