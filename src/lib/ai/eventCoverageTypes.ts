export interface RecurrenceExtractionResult {
  recurrence: {
    pattern: string;
    weekOfMonth: number | null;
    weekday: string | null;
    time: string | null;
  } | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  confidence: number;
  uncertainty: string[];
  missingFields: string[];
  suggestedFutureDates: string[];
  facts: string[];
  inferences: string[];
}

export interface SourceVerificationResult {
  supported: boolean;
  confirmedFields: string[];
  inferredFields: string[];
  missingFields: string[];
  confidence: number;
  warnings: string[];
  summary: string;
}

export interface LaneGapSuggestion {
  thinLanes: string[];
  recommendedSearches: string[];
  notes: string[];
}

export interface AdminBatchSummary {
  readyToApprove: string[];
  needsReview: string[];
  possibleDuplicates: string[];
  highConfidenceRecurring: string[];
}
