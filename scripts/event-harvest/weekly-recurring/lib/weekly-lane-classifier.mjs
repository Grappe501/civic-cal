/**
 * Pass 37 sub-lane classifier.
 */

const RULES = [
  { lane: "37A_farmers_market", patterns: [/farmers?\s*market/i, /producer\s*market/i], category: "community" },
  { lane: "37B_food_truck", patterns: [/food\s*truck/i, /mobile\s*food/i, /truck\s*night/i], category: "food_truck_festival" },
  { lane: "37C_library", patterns: [/library/i, /story\s*time/i, /book\s*club/i], category: "community" },
  { lane: "37D_senior_center", patterns: [/senior\s*center/i, /seniors?\s+program/i], category: "community" },
  { lane: "37E_parks_rec", patterns: [/parks?\s*(?:&|and)\s*rec/i, /recreation/i, /pickleball/i, /running\s*club/i], category: "community" },
  { lane: "37F_youth_sports", patterns: [/youth\s*sports/i, /soccer\s*league/i, /little\s*league/i], category: "community" },
  { lane: "37G_service_club", patterns: [/rotary/i, /lions\s*club/i, /kiwanis/i, /optimist/i], category: "civic_meeting" },
  { lane: "37H_cruise_car", patterns: [/cruise\s*night/i, /car\s*show/i, /classic\s*car/i], category: "community" },
  { lane: "37I_bingo_community", patterns: [/bingo/i, /community\s*center/i], category: "community" },
];

export function classifyWeeklyLane(title, subLaneHint) {
  if (subLaneHint) {
    const hit = RULES.find((r) => r.lane === subLaneHint);
    if (hit) return hit;
  }
  const text = String(title || "");
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule;
  }
  return { lane: "37I_bingo_community", patterns: [], category: "community" };
}

export function laneLabel(lane) {
  return lane.replace(/^37[A-I]_/, "").replace(/_/g, " ");
}
