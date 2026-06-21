import type { IntelligenceLayer } from "./eventLayers";
import { inferIntelligenceLayer } from "./eventLayers";

export interface RelationshipDensityInput {
  title: string;
  description?: string;
  category?: string;
  intelligenceLayer?: IntelligenceLayer;
  /** Rough attendance band if known: small | medium | large | massive */
  typicalAttendanceBand?: "small" | "medium" | "large" | "massive";
  isRecurringTradition?: boolean;
}

/**
 * Relationship Density Score — influence per attendee, not headcount alone.
 * Rotary breakfast (40 people) can outrank a random festival for campaign value.
 */
export function scoreRelationshipDensity(input: RelationshipDensityInput): number {
  const text = `${input.title} ${input.description ?? ""}`.toLowerCase();
  const layer = input.intelligenceLayer ?? inferIntelligenceLayer(text, input.category);

  let score = 50;

  switch (layer) {
    case "relationship":
      score = 88;
      break;
    case "community_church":
      score = 85;
      break;
    case "school_ecosystem":
      score = /rivalry|homecoming|senior night/.test(text) ? 88 : 75;
      break;
    case "government":
      score = /quorum court|election commission|school board/.test(text) ? 92 : 78;
      break;
    case "community_identity":
      score = 68;
      break;
  }

  if (/rotary|farm bureau|vfw|american legion|volunteer fire|extension office/.test(text)) score += 8;
  if (/spaghetti|catholic point|center ridge/.test(text)) score += 10;
  if (/rivalry|homecoming/.test(text)) score += 5;
  if (/county fair|watermelon|tomato|peach festival|toad suck/.test(text)) score += 3;

  if (input.typicalAttendanceBand === "small") score += 12;
  else if (input.typicalAttendanceBand === "medium") score += 6;
  else if (input.typicalAttendanceBand === "massive") score -= 5;

  if (input.isRecurringTradition) score += 5;

  return Math.max(0, Math.min(100, score));
}

/** Reference examples from product spec */
export const RELATIONSHIP_DENSITY_EXAMPLES = [
  { event: "County Fair", attendance: 5000, relationshipDensity: 70 },
  { event: "Rotary Breakfast", attendance: 40, relationshipDensity: 95 },
  { event: "Quorum Court", attendance: 25, relationshipDensity: 90 },
  { event: "Rivalry Football Game", attendance: 3000, relationshipDensity: 85 },
  { event: "Catholic Spaghetti Dinner", attendance: 1500, relationshipDensity: 92 },
];
