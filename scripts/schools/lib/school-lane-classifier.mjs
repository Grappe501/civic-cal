/**
 * Pass 27 — classify harvested text into school event lanes.
 */
export const SCHOOL_EVENT_LANES = [
  { id: "school_board", label: "School board meetings", patterns: [/school board/i, /board of education/i, /board meeting/i] },
  { id: "football", label: "Football schedules", patterns: [/football/i, /\bvs\.?\b/i] },
  { id: "basketball", label: "Basketball schedules", patterns: [/basketball/i, /hoops/i] },
  { id: "band_concert", label: "Band concerts", patterns: [/band concert/i, /concert band/i, /marching band/i, /band performance/i] },
  { id: "homecoming", label: "Homecoming", patterns: [/homecoming/i] },
  { id: "senior_night", label: "Senior night", patterns: [/senior night/i, /senior recognition/i] },
  { id: "graduation", label: "Graduation", patterns: [/graduation/i, /commencement/i, /baccalaureate/i] },
  { id: "theater", label: "Theater/plays", patterns: [/school play/i, /theater/i, /theatre/i, /musical/i, /drama/i] },
  { id: "pto_fundraiser", label: "PTO/fundraisers", patterns: [/pto/i, /booster/i, /fundraiser/i, /carnival/i] },
  { id: "college_athletics", label: "College athletics", patterns: [/razorback/i, /red wolves/i, /bears\b/i, /trojans/i, /athletics/i, /home game/i] },
  { id: "college_public", label: "College public events", patterns: [/guest speaker/i, /career fair/i, /open house/i, /community event/i, /lecture/i] },
];

export function classifySchoolLane(text) {
  const t = String(text ?? "");
  for (const lane of SCHOOL_EVENT_LANES) {
    if (lane.patterns.some((p) => p.test(t))) return lane.id;
  }
  return "school_general";
}

export function laneCategory(laneId) {
  if (laneId === "school_board") return "school_board_meeting";
  if (laneId === "college_athletics" || laneId === "football" || laneId === "basketball") return "school_athletics";
  if (laneId === "graduation") return "school_graduation";
  return "school";
}

export function laneTitle(laneId, institutionName) {
  const lane = SCHOOL_EVENT_LANES.find((l) => l.id === laneId);
  const label = lane?.label ?? "School event";
  return `${institutionName} — ${label}`;
}
