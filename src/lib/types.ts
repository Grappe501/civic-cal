export type EventCategory =
  | "civic_meeting"
  | "candidate_event"
  | "community"
  | "faith_meal"
  | "school"
  | "volunteer"
  | "government_deadline"
  | "culture"
  | "small_business";

export type EventStatus = "pending" | "approved" | "rejected" | "archived";

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
}
