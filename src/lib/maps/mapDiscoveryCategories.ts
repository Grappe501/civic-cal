import type { CivicEvent } from "../types";

/** Map discovery category taxonomy — drives pin colors on homepage map. */
export type MapDiscoveryCategory =
  | "festival"
  | "food"
  | "music"
  | "school"
  | "sports"
  | "church"
  | "government"
  | "civic"
  | "party_meeting"
  | "race"
  | "fair"
  | "parade"
  | "volunteer"
  | "student_service"
  | "candidate_event"
  | "market"
  | "holiday"
  | "hunting_fishing"
  | "other";

export const MAP_DISCOVERY_CATEGORIES: { id: MapDiscoveryCategory; label: string; color: string }[] = [
  { id: "festival", label: "Festival", color: "#6B8F71" },
  { id: "food", label: "Food", color: "#C4785A" },
  { id: "music", label: "Music", color: "#6d28d9" },
  { id: "school", label: "School", color: "#7BAFD4" },
  { id: "sports", label: "Sports", color: "#2563eb" },
  { id: "church", label: "Church", color: "#92400e" },
  { id: "government", label: "Government", color: "#2D4A3E" },
  { id: "civic", label: "Civic", color: "#047857" },
  { id: "party_meeting", label: "Party meeting", color: "#475569" },
  { id: "race", label: "Race", color: "#dc2626" },
  { id: "fair", label: "Fair", color: "#ca8a04" },
  { id: "parade", label: "Parade", color: "#db2777" },
  { id: "volunteer", label: "Volunteer", color: "#059669" },
  { id: "student_service", label: "Student service", color: "#0891b2" },
  { id: "candidate_event", label: "Candidate event", color: "#B84A32" },
  { id: "market", label: "Market", color: "#65a30d" },
  { id: "holiday", label: "Holiday", color: "#7c3aed" },
  { id: "hunting_fishing", label: "Hunting / fishing", color: "#44403c" },
  { id: "other", label: "Other", color: "#78716c" },
];

const CATEGORY_PIN: Record<string, string> = Object.fromEntries(
  MAP_DISCOVERY_CATEGORIES.map((c) => [c.id, c.color]),
);

export function inferMapDiscoveryCategory(event: CivicEvent): MapDiscoveryCategory {
  const ext = event as CivicEvent & { mapDiscoveryCategory?: string; festivalCategory?: string };
  if (ext.mapDiscoveryCategory) return ext.mapDiscoveryCategory as MapDiscoveryCategory;
  if (ext.festivalCategory) {
    if (/food|watermelon|crawdad|bbq/i.test(ext.festivalCategory)) return "food";
    if (/music|blues/i.test(ext.festivalCategory)) return "music";
    if (/county_fair|fair/i.test(ext.festivalCategory)) return "fair";
    return "festival";
  }
  const t = `${event.title} ${event.description ?? ""}`.toLowerCase();
  if (/parade|christmas parade|homecoming parade/i.test(t)) return "parade";
  if (/fair\b|county fair/i.test(t)) return "fair";
  if (/festival|fest\b|folklife|daze/i.test(t)) return "festival";
  if (/food truck|watermelon|peach|tomato|crawdad|bbq|gumbo/i.test(t)) return "food";
  if (/concert|music|blues|jazz/i.test(t)) return "music";
  if (/farmers market|market\b/i.test(t)) return "market";
  if (/5k|marathon|triathlon|race\b|run\b/i.test(t)) return "race";
  if (/student service|service hours/i.test(t)) return "student_service";
  if (event.category === "candidate_event") return "candidate_event";
  if (event.category === "public_party_meeting") return "party_meeting";
  if (event.category === "civic_meeting" || event.category === "government_deadline") return "government";
  if (event.category === "volunteer") return "volunteer";
  if (event.category === "school") return "school";
  if (event.category === "community_church" || event.category === "faith_meal") return "church";
  if (event.category === "culture") return "festival";
  if (event.category === "food_truck_festival") return "food";
  if (event.category === "community") return "civic";
  return "other";
}

export function mapPinColor(event: CivicEvent): string {
  return CATEGORY_PIN[inferMapDiscoveryCategory(event)] ?? CATEGORY_PIN.other;
}

export function mapCategoryLabel(event: CivicEvent): string {
  const id = inferMapDiscoveryCategory(event);
  return MAP_DISCOVERY_CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}
