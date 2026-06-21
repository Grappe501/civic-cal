import type { EventCategory } from "../types";

export type PersonalityMode = "citizen" | "candidate" | "organizer" | "volunteer_seeker";

export type DiscoveryChipId =
  | "government"
  | "festivals"
  | "church"
  | "sports"
  | "races"
  | "music"
  | "young_arkansas"
  | "food_trail"
  | "parades"
  | "community_anchors"
  | "family"
  | "volunteer"
  | "schools"
  | "food"
  | "markets"
  | "holidays"
  | "highest_attendance"
  | "highest_rd"
  | "church_meals"
  | "gov_meetings"
  | "volunteer_ops"
  | "candidate_presence"
  | "campaign_volunteer_opportunities"
  | "food_trucks";

export type ExploreIntent =
  | "near_me"
  | "busiest_weekend"
  | "hidden_gems"
  | "worth_the_drive"
  | "candidate_presence";

export type SafariDriveTime = "15" | "30" | "60" | "120" | "anywhere";

export type SafariInterest =
  | "food"
  | "music"
  | "community"
  | "politics"
  | "sports"
  | "running"
  | "faith"
  | "kids"
  | "volunteer";

export interface SafariPreferences {
  driveTime: SafariDriveTime;
  interests: SafariInterest[];
}

export type RaceCategoryId =
  | "5k"
  | "10k"
  | "half_marathon"
  | "marathon"
  | "trail"
  | "mud"
  | "charity"
  | "turkey_trot"
  | "color"
  | "school_fundraiser"
  | "triathlon"
  | "cycling"
  | "walking";

export interface PublicDiscoveryAnswer {
  source: "deterministic" | "openai";
  query: string;
  headline: string;
  summary: string;
  eventIds: string[];
  followUpPrompts: string[];
  mode: PersonalityMode;
}

export interface DiscoveryChipDef {
  id: DiscoveryChipId;
  emoji: string;
  label: string;
  tagline?: string;
  modes: PersonalityMode[];
  categories?: EventCategory[];
  keywords?: RegExp;
}
