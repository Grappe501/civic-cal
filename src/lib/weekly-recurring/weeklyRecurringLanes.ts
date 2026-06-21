import type { CivicEvent } from "../types";

export type WeeklyRecurringSubLane =
  | "37A_farmers_market"
  | "37B_food_truck"
  | "37C_library"
  | "37D_senior_center"
  | "37E_parks_rec"
  | "37F_youth_sports"
  | "37G_service_club"
  | "37H_cruise_car"
  | "37I_bingo_community";

export const WEEKLY_SUB_LANE_LABELS: Record<WeeklyRecurringSubLane, string> = {
  "37A_farmers_market": "Farmers market",
  "37B_food_truck": "Food truck circuit",
  "37C_library": "Library program",
  "37D_senior_center": "Senior center",
  "37E_parks_rec": "Parks & recreation",
  "37F_youth_sports": "Youth sports",
  "37G_service_club": "Service club",
  "37H_cruise_car": "Cruise / car show",
  "37I_bingo_community": "Bingo / community center",
};

export function isWeeklyRecurringEvent(event: CivicEvent): boolean {
  return (
    event.harvestBatch === "weekly_recurring_pass37" ||
    Boolean(event.recurringRegistryId?.startsWith("wr-")) ||
    (event.festivalCategory?.startsWith("37") ?? false)
  );
}

export function weeklySubLaneLabel(event: CivicEvent): string | null {
  const lane = event.festivalCategory as WeeklyRecurringSubLane | undefined;
  if (lane && lane in WEEKLY_SUB_LANE_LABELS) return WEEKLY_SUB_LANE_LABELS[lane];
  return null;
}
