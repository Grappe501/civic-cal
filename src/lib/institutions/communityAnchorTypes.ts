/** Community Anchors — rural intelligence at trust × relationships × leadership */

export type CommunityAnchorKind =
  | "extension_office"
  | "four_h"
  | "homemakers"
  | "vfd"
  | "church"
  | "school"
  | "college"
  | "library"
  | "chamber"
  | "rotary"
  | "lions"
  | "farm_bureau"
  | "hospital"
  | "parade"
  | "food_event";

export type CommunityAttendanceSignal =
  | "agriculture"
  | "faith"
  | "youth"
  | "families"
  | "seniors"
  | "veterans"
  | "business_leaders"
  | "educators";

export const ATTENDANCE_SIGNAL_LABELS: Record<CommunityAttendanceSignal, string> = {
  agriculture: "Agriculture audience",
  faith: "Faith audience",
  youth: "Youth audience",
  families: "Families",
  seniors: "Seniors",
  veterans: "Veterans",
  business_leaders: "Business leaders",
  educators: "Educators",
};

export type FoodTrailCategory =
  | "fish_fry"
  | "spaghetti_dinner"
  | "wild_game_dinner"
  | "chili_cookoff"
  | "bbq_cookoff"
  | "pancake_breakfast"
  | "catfish_festival"
  | "crawfish_boil"
  | "pie_contest"
  | "community_meal"
  | "church_supper";

export const FOOD_TRAIL_LABELS: Record<FoodTrailCategory, string> = {
  fish_fry: "Fish fry",
  spaghetti_dinner: "Spaghetti dinner",
  wild_game_dinner: "Wild game dinner",
  chili_cookoff: "Chili cookoff",
  bbq_cookoff: "BBQ cookoff",
  pancake_breakfast: "Pancake breakfast",
  catfish_festival: "Catfish festival",
  crawfish_boil: "Crawfish boil",
  pie_contest: "Pie contest",
  community_meal: "Community meal",
  church_supper: "Church supper",
};

export interface ExtensionOfficeEntry {
  id: string;
  county: string;
  officeName: string;
  address?: string | null;
  website?: string | null;
  calendarUrl?: string | null;
  newsletterUrl?: string | null;
  agricultureAgents?: string[];
  familyConsumerAgents?: string[];
  fourHAgents?: string[];
  harvestTargets: string[];
  verified: boolean;
  status: "scaffold" | "partial" | "verified";
}

export interface HomemakerClubEntry {
  id: string;
  clubName: string;
  county: string;
  city?: string | null;
  meetingLocation?: string | null;
  meetingSchedule?: string | null;
  countyAssociation?: string | null;
  publicEventsNotes?: string | null;
  verified: boolean;
  status: "scaffold" | "partial" | "verified";
}

export interface VfdAnchorEntry {
  id: string;
  name: string;
  county: string;
  city: string;
  stationLocation?: string | null;
  coverageArea?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  publicContact?: string | null;
  harvestTargets: string[];
  verified: boolean;
}

export interface ParadeProfile {
  eventTitle: string;
  slug?: string;
  paradeType: "christmas" | "veterans" | "homecoming" | "county_fair" | "rodeo" | "independence" | "festival" | "other";
  estimatedAttendance?: string | null;
  route?: string | null;
  floatOpportunity?: boolean;
  candidateParticipation?: boolean;
  boothOpportunity?: boolean;
}

export interface AnchorEventSourcing {
  kind: CommunityAnchorKind;
  label: string;
  anchorCount: number;
  eventsSourced: number;
  influenceNote?: string;
}

export interface CommunityAnchorsSnapshot {
  county: string;
  extensionOffices: ExtensionOfficeEntry[];
  homemakerClubs: HomemakerClubEntry[];
  vfds: VfdAnchorEntry[];
  anchorCounts: {
    churches: number;
    schools: number;
    colleges: number;
    extensionOffices: number;
    fourHClubs: number;
    homemakerClubs: number;
    vfds: number;
    libraries: number;
    chambers: number;
    rotary: number;
    lions: number;
    farmBureau: number;
    hospitals: number;
  };
  eventSourcing: AnchorEventSourcing[];
  countyCoverageScore: number;
  parades: ParadeProfile[];
  foodEvents: { title: string; slug?: string; category: FoodTrailCategory; signals: CommunityAttendanceSignal[] }[];
  topAttendanceSignals: { signal: CommunityAttendanceSignal; eventCount: number; influenceScore: number }[];
}

export const EXTENSION_HARVEST_TARGETS = [
  "4-H meeting",
  "Livestock show",
  "Food preservation class",
  "Gardening workshop",
  "Poultry workshop",
  "Farm management event",
  "Youth leadership program",
  "Master Gardener event",
  "Family consumer science event",
] as const;

export const VFD_HARVEST_TARGETS = [
  "Fish fry",
  "BBQ fundraiser",
  "Pancake breakfast",
  "Community cookout",
  "Open house",
  "Safety fair",
  "Community festival",
] as const;

export const PARADE_HARVEST_TARGETS = [
  "Christmas parade",
  "Veterans Day parade",
  "Homecoming parade",
  "County fair parade",
  "Rodeo parade",
  "Independence Day parade",
  "Festival parade",
] as const;
