import type { ProfileEntityType } from "../profiles/profileTypes";

export type NarrativeVerificationStatus = "placeholder" | "partial" | "verified";

export interface NarrativeTimelineEntry {
  year?: number | string | null;
  label: string;
  note?: string | null;
}

export interface NarrativeFaq {
  question: string;
  answer: string;
}

export interface NarrativeSource {
  label: string;
  url: string;
  trust?: "high" | "medium" | "low";
}

export interface CommunityNarrative {
  id: string;
  entityType: ProfileEntityType | "event";
  slug: string;
  title: string;
  city?: string | null;
  county?: string | null;
  about?: string | null;
  history?: string | null;
  originStory?: string | null;
  timeline?: NarrativeTimelineEntry[];
  interestingFacts?: string[];
  faqs?: NarrativeFaq[];
  relatedEntitySlugs?: { entityType: ProfileEntityType | "event"; slug: string; label?: string }[];
  sources?: NarrativeSource[];
  lastRefreshedAt?: string | null;
  verificationStatus: NarrativeVerificationStatus;
  researchNotes?: string | null;
}
