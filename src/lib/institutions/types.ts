/** Community Institutions Layer — churches, schools, colleges, civic orgs */

export type InstitutionSizeCategory = "small" | "medium" | "large" | "mega";

export type SchoolType = "public" | "private" | "charter";

export interface ChurchDirectoryEntry {
  id: string;
  churchName: string;
  city: string;
  county: string;
  denomination?: string | null;
  address?: string | null;
  website?: string | null;
  leadershipPublic?: string | null;
  serviceTimes?: string | null;
  youthPrograms?: string | null;
  schoolAttached?: boolean | null;
  foodPantry?: boolean | null;
  communityMeals?: boolean | null;
  annualEvents?: string[];
  vbs?: boolean | null;
  trunkOrTreat?: boolean | null;
  fishFry?: boolean | null;
  spaghettiDinner?: boolean | null;
  sizeCategory?: InstitutionSizeCategory | null;
  sourceLinks?: { label: string; url: string }[];
  lastVerified?: string | null;
  verified: boolean;
  status: "scaffold" | "partial" | "verified";
}

export interface SchoolGovernance {
  boardMeetingSchedule?: string | null;
  boardMembers?: string[];
  boardMeetingLocation?: string | null;
  publicCommentInfo?: string | null;
}

export interface SchoolActivities {
  football?: boolean;
  basketball?: boolean;
  baseball?: boolean;
  softball?: boolean;
  soccer?: boolean;
  track?: boolean;
  band?: boolean;
  choir?: boolean;
  ffa?: boolean;
  fourH?: boolean;
  academicTeams?: boolean;
}

export interface SchoolCalendarFeed {
  harvestTargets: string[];
  lastHarvestAt?: string | null;
}

export interface SchoolDirectoryEntry {
  id: string;
  schoolName: string;
  city: string;
  county: string;
  district?: string | null;
  schoolType?: SchoolType | null;
  gradesServed?: string | null;
  enrollment?: number | null;
  mascot?: string | null;
  schoolColors?: string | null;
  principal?: string | null;
  superintendent?: string | null;
  address?: string | null;
  website?: string | null;
  governance?: SchoolGovernance;
  activities?: SchoolActivities;
  calendarFeed?: SchoolCalendarFeed;
  sourceLinks?: { label: string; url: string }[];
  lastVerified?: string | null;
  verified: boolean;
  status: "scaffold" | "partial" | "verified";
}

export interface CollegeDirectoryEntry {
  id: string;
  institutionName: string;
  city: string;
  county: string;
  institutionType: "university" | "community_college" | "private_college";
  enrollment?: number | null;
  studentDemographics?: string | null;
  athletics?: string[];
  majorPrograms?: string[];
  campusCalendarUrl?: string | null;
  publicEventsNotes?: string | null;
  calendarFeed?: { harvestTargets: string[]; lastHarvestAt?: string | null };
  sourceLinks?: { label: string; url: string }[];
  lastVerified?: string | null;
  verified: boolean;
  status: "scaffold" | "partial" | "verified";
}

export interface CivicOrganizationEntry {
  id: string;
  name: string;
  orgType: "vfd" | "rotary" | "lions" | "kiwanis" | "farm_bureau" | "ffa" | "four_h" | "chamber" | "library" | "hospital" | "community_center" | "youth_sports";
  city: string;
  county: string;
  website?: string | null;
  verified: boolean;
  lastVerified?: string | null;
}

export type InstitutionCoverageType =
  | "churches"
  | "schools"
  | "colleges"
  | "libraries"
  | "organizations"
  | "hospitals"
  | "vfds";

export interface InstitutionCoverageRow {
  type: InstitutionCoverageType;
  label: string;
  known: number;
  verified: number;
  expected: number;
  coveragePercent: number;
}

export interface CommunityStrengthIndicators {
  churchCount: number;
  schoolCount: number;
  collegePresence: boolean;
  collegeCount: number;
  festivalCount: number;
  volunteerOrganizationCount: number;
  recurringTraditionCount: number;
  annualEventCount: number;
  libraryCount: number;
  hospitalCount: number;
  vfdCount: number;
}

export interface CountyCommunityInstitutionsLayer {
  county: string;
  churches: ChurchDirectoryEntry[];
  schools: SchoolDirectoryEntry[];
  colleges: CollegeDirectoryEntry[];
  organizations: CivicOrganizationEntry[];
  coverage: InstitutionCoverageRow[];
  strength: CommunityStrengthIndicators;
}

export interface SportsHubSnapshot {
  county: string;
  highSchool: {
    football: number;
    basketball: number;
    baseball: number;
    softball: number;
    soccer: number;
    track: number;
    band: number;
  };
  college: {
    scheduledHomeGames: number;
    tournaments: number;
  };
  upcomingSportsEvents: { title: string; city?: string; slug?: string; rdScore?: number }[];
}

/** Church Event Engine — harvest query patterns */
export const CHURCH_EVENT_HARVEST_PATTERNS = [
  "Fish Fry",
  "Spaghetti Dinner",
  "Wild Game Dinner",
  "BBQ Fundraiser",
  "Pancake Breakfast",
  "Church Picnic",
  "Homecoming",
  "Fall Festival",
  "VBS",
  "Vacation Bible School",
  "Trunk or Treat",
  "Community Thanksgiving Meal",
  "Community Christmas Meal",
] as const;

export type ChurchEventHarvestPattern = (typeof CHURCH_EVENT_HARVEST_PATTERNS)[number];

export const SCHOOL_CALENDAR_HARVEST_TARGETS = [
  "School Board Meeting",
  "Homecoming",
  "Senior Night",
  "Graduation",
  "Band Competition",
  "Athletic Event",
  "School Play",
  "Fundraiser",
] as const;

export const COLLEGE_CALENDAR_HARVEST_TARGETS = [
  "Sports",
  "Concert",
  "Guest Speaker",
  "Graduation",
  "Community Event",
] as const;
