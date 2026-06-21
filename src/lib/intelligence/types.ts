import type { IntelligenceLayer } from "./eventLayers";
import type { AttendanceBand } from "../types";

export type { IntelligenceLayer };

export type IngestionReviewStatus =
  | "needs_review"
  | "needs_verification"
  | "verified_flagship"
  | "approved"
  | "rejected"
  | "duplicate";

export interface IngestionCandidate {
  id: string;
  title: string;
  description?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venueName?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  intelligenceLayer?: IntelligenceLayer;
  civicValue?: string | null;
  politicalOpportunityScore?: number | null;
  relationshipDensityScore?: number | null;
  typicalAttendanceBand?: AttendanceBand | null;
  recurringRegistryId?: string | null;
  confidenceScore?: number | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceType?: string | null;
  discoveredBy?: string | null;
  rawText?: string | null;
  reviewStatus: IngestionReviewStatus | string;
  duplicateOfEventId?: string | null;
  notes?: string | null;
  isRecurringAnnual?: boolean;
  flagshipId?: string;
  harvestBatch?: string | null;
  harvestWindow?: { start: string; end: string } | null;
  estimatedCrowdMin?: number | null;
  estimatedCrowdMax?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type IntelligenceSection =
  | "newly_discovered"
  | "needs_review"
  | "high_civic_value"
  | "missing_date"
  | "missing_location"
  | "possible_duplicates"
  | "flagship_annual"
  | "government_meetings"
  | "church_fundraisers";
