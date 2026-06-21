export type FeedAttachmentStatus = "attached" | "missing" | "search_only";

export interface FeedSlotRecord {
  id: string;
  scope: "county" | "city";
  county: string;
  city?: string;
  slot_type: string;
  label: string;
  institution_name: string;
  calendar_url: string | null;
  contact_url: string | null;
  attachment_status: FeedAttachmentStatus;
  expected_yield: number;
  source_type: string;
  tier: number;
}

export interface CountyFeedCoverage {
  county: string;
  institutions: number;
  institutionBreakdown: {
    churches: number;
    schools: number;
    colleges: number;
    organizations: number;
    extensionOffices: number;
    homemakerClubs: number;
    total: number;
  };
  feedSlotsExpected: number;
  feedsAttached: number;
  feedsMissing: number;
  feedsSearchOnly: number;
  coveragePercent: number;
  verifiedEvents: number;
  attachedProjectedYield: number;
  potentialProjectedYield: number;
  densityProjectedEvents: number;
}

export interface FeedAttachmentReport {
  generatedAt: string;
  metrics: {
    knownInstitutions: number;
    feedSlotsTotal: number;
    feedsAttached: number;
    feedsMissing: number;
    feedsSearchOnly: number;
    coveragePercent: number;
    verifiedEventCount: number;
    stagedPartyMeetings: number;
    attachedProjectedYield: number;
    potentialProjectedYield: number;
    densityEngineProjected: number;
    densityEngineGoal: number;
  };
  counties: CountyFeedCoverage[];
  bottomCounties: CountyFeedCoverage[];
  bottomCities: {
    city: string;
    county: string;
    feedSlotsExpected: number;
    feedsAttached: number;
    feedsMissing: number;
    coveragePercent: number;
    attachedProjectedYield: number;
    potentialProjectedYield: number;
  }[];
  tier1Gaps: FeedSlotRecord[];
}
