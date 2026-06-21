export type EventCategory =
  | "civic_meeting"
  | "candidate_event"
  | "community"
  | "community_church"
  | "faith_meal"
  | "school"
  | "volunteer"
  | "government_deadline"
  | "culture"
  | "small_business"
  | "food_truck_festival"
  | "public_party_meeting";

import type { IntelligenceLayer } from "./intelligence/eventLayers";
import type { SubmissionTrustSignals } from "./submitRiskScore";

export type { IntelligenceLayer } from "./intelligence/eventLayers";

export type AttendanceBand = "small" | "medium" | "large" | "massive";

export type EventStatus = "pending" | "approved" | "rejected" | "archived";

export type MapStatus = "pending" | "geocoded" | "manual_review" | "verified" | "online" | "disabled";
export type LocationConfidence = "high" | "medium" | "low" | "manual" | "unknown";

export interface CivicEvent {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  allDay?: boolean;
  timezone?: string;
  city?: string | null;
  county: string;
  address?: string | null;
  locationName?: string | null;
  category: EventCategory;
  hostOrganization?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  websiteUrl?: string | null;
  imageUrl?: string | null;
  isRecurring?: boolean;
  isPublicGovernmentMeeting?: boolean;
  candidateRelevant?: boolean;
  isFamilyFriendly?: boolean;
  isFree?: boolean;
  highCivicValue?: boolean;
  featured?: boolean;
  status?: EventStatus;
  source?: string;
  submitterName?: string | null;
  dateTbd?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  formattedAddress?: string | null;
  locationConfidence?: LocationConfidence | null;
  mapStatus?: MapStatus;
  state?: string;
  isOnlineOnly?: boolean;
  intelligenceLayer?: IntelligenceLayer;
  relationshipDensityScore?: number | null;
  typicalAttendanceBand?: AttendanceBand | null;
  recurringRegistryId?: string | null;
  harvestBatch?: string | null;
  festivalCategory?: string | null;
  politicalEventRegistryId?: string | null;
  historyDossier?: {
    firstYearHeld?: number | null;
    honors?: string | null;
    typicalAudience?: string | null;
    historicSignificance?: string | null;
    notableSpeakers?: { name: string; year?: number; role?: string; source_url: string }[];
    recurringPattern?: string | null;
    hostOrganization?: string | null;
    ticketUrl?: string | null;
    sourceLinks?: { label: string; url: string; trust?: string }[];
    lastRefreshed?: string | null;
    confidenceScore?: number;
    historyAvailable?: boolean;
  } | null;
}

export interface EventFilters {
  county?: string;
  city?: string;
  category?: EventCategory;
  q?: string;
  civicOnly?: boolean;
  familyFriendly?: boolean;
  freeOnly?: boolean;
  candidateRelevant?: boolean;
  thisWeekend?: boolean;
  featured?: boolean;
  limit?: number;
}

export interface SubmitEventPayload {
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  allDay?: boolean;
  city?: string;
  county: string;
  address?: string;
  locationName?: string;
  category: EventCategory;
  hostOrganization?: string;
  contactName?: string;
  contactEmail?: string;
  websiteUrl?: string;
  isRecurring?: boolean;
  isPublicGovernmentMeeting?: boolean;
  candidateRelevant?: boolean;
  isFamilyFriendly?: boolean;
  isFree?: boolean;
  submitterName?: string;
  state?: string;
  isOnlineOnly?: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  locationConfidence?: LocationConfidence;
  mapStatus?: MapStatus;
  submissionTrust?: SubmissionTrustSignals;
  spamRiskScore?: number;
  spamFlags?: string[];
}
