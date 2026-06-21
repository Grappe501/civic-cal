import type { FreshnessMeta } from "../freshness/freshnessTypes";

export type ProfileEntityType =
  | "event"
  | "city"
  | "county"
  | "organization"
  | "church"
  | "school"
  | "college"
  | "candidate"
  | "host"
  | "race"
  | "festival"
  | "parade"
  | "state_date"
  | "volunteer_opportunity";

export interface RelatedProfileLink {
  slug: string;
  title: string;
  entityType: ProfileEntityType;
  href: string;
  note?: string;
}

export interface CommunityProfile {
  slug: string;
  title: string;
  entityType: ProfileEntityType;
  city?: string | null;
  county?: string | null;
  canonicalUrl: string;
  summary: string;
  aiSummary: string;
  relatedLinks: RelatedProfileLink[];
  freshness: FreshnessMeta;
  /** Optional org id for host/church/school lookups */
  organizationSlug?: string;
  sourceEventSlug?: string;
}

export const ENTITY_DIRECTORY_ROUTES: Record<ProfileEntityType, string | null> = {
  event: null,
  city: null,
  county: "/counties",
  organization: "/organizations",
  church: "/churches",
  school: "/schools",
  college: "/colleges",
  candidate: "/campaigns",
  host: "/host",
  race: "/races",
  festival: "/festivals",
  parade: "/parades",
  state_date: "/dates",
  volunteer_opportunity: "/volunteer-opportunities",
};

export const ENTITY_TYPE_LABELS: Record<ProfileEntityType, string> = {
  event: "Event",
  city: "City",
  county: "County",
  organization: "Organization",
  church: "Church",
  school: "School",
  college: "College",
  candidate: "Candidate",
  host: "Host",
  race: "Race",
  festival: "Festival",
  parade: "Parade",
  state_date: "Important date",
  volunteer_opportunity: "Volunteer opportunity",
};
