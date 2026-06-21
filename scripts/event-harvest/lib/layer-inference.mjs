/**
 * Layer inference for harvest scripts (mirrors src/lib/intelligence/eventLayers.ts).
 */

const LAYER_PATTERNS = [
  { layer: "government", re: /city council|school board|quorum court|planning commission|a&p commission|airport board|water board|library board|election commission|public hearing|legislative town hall|zoning/i },
  { layer: "community_church", re: /spaghetti|fish fry|brisket|bbq dinner|wild game|men'?s breakfast|community breakfast|trunk or treat|vbs|vacation bible|thanksgiving meal|church dinner|church picnic|catholic point|parish/i },
  { layer: "school_ecosystem", re: /homecoming|senior night|rivalry|football|basketball|ffa|4-h|livestock show|booster club|pto\b|school carnival|band competition|athletic banquet/i },
  { layer: "relationship", re: /rotary|lions club|kiwanis|farm bureau|cattlemen|realtor|chamber breakfast|vfw|american legion|volunteer fire|pancake breakfast|extension office|cooperative extension|senior center/i },
  { layer: "community_identity", re: /third thursday|first friday|downtown alive|concert in the park|food truck|parade|tree lighting|easter egg|fall festival|heritage|pioneer days|county fair|peach festival|tomato festival|watermelon festival|toad suck|rodeo|car show|gumbo cookoff|festival|fair\b/i },
];

export function inferLayer(text, category) {
  const t = String(text).toLowerCase();
  for (const { layer, re } of LAYER_PATTERNS) {
    if (re.test(t)) return layer;
  }
  if (category === "civic_meeting") return "government";
  if (category === "community_church" || category === "faith_meal") return "community_church";
  if (category === "school") return "school_ecosystem";
  if (category === "small_business" || category === "volunteer") return "relationship";
  return "community_identity";
}

export function inferCategory(text) {
  const t = text.toLowerCase();
  if (/city council|quorum court|planning commission|public hearing|airport board|water board/.test(t)) return "civic_meeting";
  if (/school board/.test(t)) return "school";
  if (/spaghetti|fish fry|bbq|brisket|church dinner|wild game|trunk or treat|catholic point/.test(t)) return "community_church";
  if (/homecoming|rivalry|ffa|4-h|booster|pto\b|livestock show/.test(t)) return "school";
  if (/rotary|farm bureau|vfw|american legion|volunteer fire|chamber breakfast|extension office/.test(t)) return "small_business";
  if (/festival|fair|parade|toad suck|watermelon|tomato|peach/.test(t)) return "community";
  if (/library|author event/.test(t)) return "culture";
  if (/forum|town hall|candidate/.test(t)) return "candidate_event";
  return "community";
}

export function scoreRelationshipDensity(layer, text, attendanceBand) {
  let score = 50;
  switch (layer) {
    case "relationship": score = 88; break;
    case "community_church": score = 85; break;
    case "school_ecosystem": score = /rivalry|homecoming/.test(text) ? 88 : 75; break;
    case "government": score = /quorum court|election commission/.test(text) ? 92 : 78; break;
    case "community_identity": score = 68; break;
  }
  if (/rotary|farm bureau|vfw|volunteer fire|extension/.test(text)) score += 8;
  if (/spaghetti|catholic point/.test(text)) score += 10;
  if (attendanceBand === "small") score += 12;
  if (attendanceBand === "massive") score -= 5;
  return Math.min(100, Math.max(0, score));
}

export function enrichCandidate(base) {
  const text = `${base.title} ${base.description || ""} ${base.raw_text || ""}`;
  const category = base.category || inferCategory(text);
  const intelligence_layer = base.intelligence_layer || inferLayer(text, category);
  const typical_attendance_band = base.typical_attendance_band || null;
  const relationship_density_score =
    base.relationship_density_score ??
    scoreRelationshipDensity(intelligence_layer, text.toLowerCase(), typical_attendance_band);
  return {
    ...base,
    category,
    intelligence_layer,
    relationship_density_score,
  };
}
