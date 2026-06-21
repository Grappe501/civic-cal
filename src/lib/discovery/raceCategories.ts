import type { RaceCategoryId } from "./types";

export const RACE_CATEGORIES: { id: RaceCategoryId; label: string; pattern: RegExp }[] = [
  { id: "5k", label: "5K", pattern: /\b5k\b|5-k|five k/i },
  { id: "10k", label: "10K", pattern: /\b10k\b|10-k|ten k/i },
  { id: "half_marathon", label: "Half Marathon", pattern: /half marathon|13\.1|half-marathon/i },
  { id: "marathon", label: "Marathon", pattern: /\bmarathon\b|26\.2/i },
  { id: "trail", label: "Trail Run", pattern: /trail run|trail race|ultra/i },
  { id: "mud", label: "Mud Run", pattern: /mud run|obstacle|sprint/i },
  { id: "charity", label: "Charity Run", pattern: /charity run|benefit run|run for/i },
  { id: "turkey_trot", label: "Turkey Trot", pattern: /turkey trot|thanksgiving run/i },
  { id: "color", label: "Color Run", pattern: /color run|color dash/i },
  { id: "school_fundraiser", label: "School Fundraiser Run", pattern: /school run|booster run|fun run/i },
  { id: "triathlon", label: "Triathlon", pattern: /triathlon|tri-/i },
  { id: "cycling", label: "Cycling", pattern: /bike ride|cycling|century ride/i },
  { id: "walking", label: "Walking Events", pattern: /walkathon|walk for|5k walk/i },
];

export function matchRaceCategory(text: string, id: RaceCategoryId): boolean {
  const cat = RACE_CATEGORIES.find((c) => c.id === id);
  return cat ? cat.pattern.test(text) : false;
}

export function isRaceEvent(title: string, description?: string | null): boolean {
  const text = `${title} ${description ?? ""}`;
  return RACE_CATEGORIES.some((c) => c.pattern.test(text));
}
