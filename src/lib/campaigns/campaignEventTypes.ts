/** Campaign-owned events — live beside community calendar events */

export type CampaignEventType =
  | "fundraiser"
  | "meet_and_greet"
  | "town_hall"
  | "volunteer_training"
  | "phone_bank"
  | "canvass"
  | "meet_the_candidate"
  | "coffee"
  | "policy_roundtable"
  | "church_visit"
  | "parade"
  | "forum"
  | "debate";

export interface CampaignOwnedEvent {
  id: string;
  workspaceSlug: string;
  title: string;
  eventType: CampaignEventType;
  startAt: string;
  endAt?: string | null;
  allDay?: boolean;
  city?: string | null;
  county?: string | null;
  locationName?: string | null;
  notes?: string | null;
  candidateAttending?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const CAMPAIGN_EVENT_TYPE_LABELS: Record<CampaignEventType, string> = {
  fundraiser: "Fundraiser",
  meet_and_greet: "Meet & greet",
  town_hall: "Town hall",
  volunteer_training: "Volunteer training",
  phone_bank: "Phone bank",
  canvass: "Canvass",
  meet_the_candidate: "Meet the candidate",
  coffee: "Coffee with candidate",
  policy_roundtable: "Policy roundtable",
  church_visit: "Church visit",
  parade: "Parade",
  forum: "Forum",
  debate: "Debate",
};

export interface ScheduleConflict {
  severity: "high" | "medium";
  campaignEvent: CampaignOwnedEvent;
  communityEvent: { id: string; title: string; slug: string; startAt: string; county: string; city?: string | null };
  message: string;
  communityRd?: number;
  expectedCrowdNote?: string;
}
