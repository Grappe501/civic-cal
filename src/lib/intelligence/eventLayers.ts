/**
 * Five-layer Arkansas Everywhere intelligence taxonomy.
 * Layer 1 = civic duty; Layers 2–5 = where trust, relationships, and votes are built.
 */

export type IntelligenceLayer =
  | "government"
  | "community_identity"
  | "community_church"
  | "school_ecosystem"
  | "relationship";

export interface LayerDefinition {
  id: IntelligenceLayer;
  number: 1 | 2 | 3 | 4 | 5;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  /** Subtypes harvesters should watch for */
  watchFor: string[];
}

export const INTELLIGENCE_LAYERS: LayerDefinition[] = [
  {
    id: "government",
    number: 1,
    label: "Layer 1 — Government",
    shortLabel: "Government",
    description: "Civic-value meetings — important, often low attendance.",
    color: "bg-ark-pine text-white",
    watchFor: [
      "City Council",
      "School Board",
      "Quorum Court",
      "Planning Commission",
      "A&P Commission",
      "Airport Board",
      "Water Board",
      "Library Board",
      "County Election Commission",
      "Public Hearing",
      "Legislative Town Hall",
    ],
  },
  {
    id: "community_identity",
    number: 2,
    label: "Layer 2 — Community Identity",
    shortLabel: "Community identity",
    description: "Where entire communities show up — fairs, festivals, parades (500–5,000+).",
    color: "bg-emerald-800 text-white",
    watchFor: [
      "Third Thursday",
      "First Friday",
      "Downtown Alive",
      "Concerts in the Park",
      "Christmas Parade",
      "Tree Lighting",
      "County Fair",
      "Peach Festival",
      "Tomato Festival",
      "Watermelon Festival",
      "Rodeo",
      "Car Show",
      "Heritage Festival",
      "Homecoming Festival",
    ],
  },
  {
    id: "community_church",
    number: 3,
    label: "Layer 3 — Community Church Events",
    shortLabel: "Community church",
    description: "Not services — community-facing church meals & fundraisers where trust is built.",
    color: "bg-ark-clay text-white",
    watchFor: [
      "Spaghetti dinner",
      "Fish fry",
      "Brisket dinner",
      "BBQ fundraiser",
      "Wild game supper",
      "Men's breakfast",
      "Community breakfast",
      "Trunk or Treat",
      "VBS family night",
      "Thanksgiving meal",
      "Youth fundraiser dinner",
    ],
  },
  {
    id: "school_ecosystem",
    number: 4,
    label: "Layer 4 — School Ecosystem",
    shortLabel: "School ecosystem",
    description: "The football stadium is the town square — games, FFA, 4-H, booster events.",
    color: "bg-sky-800 text-white",
    watchFor: [
      "Homecoming",
      "Senior Night",
      "Rivalry football",
      "Rivalry basketball",
      "Band competition",
      "FFA",
      "4-H",
      "Livestock show",
      "Booster club",
      "PTO",
      "School carnival",
    ],
  },
  {
    id: "relationship",
    number: 5,
    label: "Layer 5 — Relationship Events",
    shortLabel: "Relationship",
    description: "50–300 highly connected attendees — where campaigns win.",
    color: "bg-ark-rust text-white",
    watchFor: [
      "Chamber breakfast",
      "Rotary",
      "Lions Club",
      "Kiwanis",
      "Farm Bureau",
      "Cattlemen",
      "Realtors Association",
      "Volunteer Fire Department dinner",
      "VFW",
      "American Legion",
      "Senior Center lunch",
      "Extension office workshop",
    ],
  },
];

/** Gold sources harvesters often miss */
export const HIDDEN_GOLD_SOURCES = [
  "Arkansas Cooperative Extension / county extension office",
  "Farm Bureau (every county)",
  "FFA / 4-H livestock shows & banquets",
  "County livestock shows",
  "Volunteer fire department fish fries & pancake breakfasts",
  "Hospital foundation charity dinners & health fairs",
  "Public library author events & candidate forums",
  "Community college weekly events",
];

const LAYER_PATTERNS: { layer: IntelligenceLayer; re: RegExp }[] = [
  { layer: "government", re: /city council|school board|quorum court|planning commission|a&p commission|airport board|water board|library board|election commission|public hearing|legislative town hall|zoning/i },
  { layer: "community_church", re: /spaghetti|fish fry|brisket|bbq dinner|wild game|men'?s breakfast|community breakfast|trunk or treat|vbs|vacation bible|thanksgiving meal|church dinner|church picnic|catholic point|parish/i },
  { layer: "school_ecosystem", re: /homecoming|senior night|rivalry|football|basketball|ffa|4-h|livestock show|booster club|pto\b|school carnival|band competition|academic competition|athletic banquet/i },
  { layer: "relationship", re: /rotary|lions club|kiwanis|farm bureau|cattlemen|realtor|chamber breakfast|vfw|american legion|volunteer fire|pancake breakfast|extension office|cooperative extension|senior center/i },
  { layer: "community_identity", re: /third thursday|first friday|downtown alive|concert in the park|food truck|parade|tree lighting|easter egg|fall festival|heritage|pioneer days|county fair|peach festival|tomato festival|watermelon festival|toad suck|rodeo|car show|gumbo cookoff|festival|fair\b/i },
];

export function inferIntelligenceLayer(text: string, category?: string): IntelligenceLayer {
  const t = text.toLowerCase();
  for (const { layer, re } of LAYER_PATTERNS) {
    if (re.test(t)) return layer;
  }
  if (category === "civic_meeting" || category === "government_deadline") return "government";
  if (category === "community_church" || category === "faith_meal") return "community_church";
  if (category === "school") return "school_ecosystem";
  if (category === "small_business" || category === "volunteer") return "relationship";
  if (category === "community" || category === "culture") return "community_identity";
  return "community_identity";
}

export function layerDefinition(layer: IntelligenceLayer): LayerDefinition {
  return INTELLIGENCE_LAYERS.find((l) => l.id === layer) ?? INTELLIGENCE_LAYERS[1];
}

export function layerLabel(layer: IntelligenceLayer): string {
  return layerDefinition(layer).shortLabel;
}

export function layerColor(layer: IntelligenceLayer): string {
  return layerDefinition(layer).color;
}
