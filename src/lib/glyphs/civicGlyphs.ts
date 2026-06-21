/** Civic Glyph System — visual language for hosts (no letters, logos, or political symbols) */

export type HostGlyphKind =
  | "church"
  | "school"
  | "college"
  | "festival"
  | "chamber"
  | "rotary"
  | "vfd"
  | "library"
  | "farm_bureau"
  | "extension"
  | "homemakers"
  | "naacp"
  | "campaign"
  | "business"
  | "nonprofit"
  | "race"
  | "music"
  | "four_h"
  | "community";

export interface CivicGlyphDef {
  kind: HostGlyphKind;
  glyph: string;
  label: string;
  color: string;
  description: string;
}

export const CIVIC_GLYPHS: Record<HostGlyphKind, CivicGlyphDef> = {
  church: { kind: "church", glyph: "✦", label: "Church", color: "#5C4B8A", description: "Faith community & meals" },
  school: { kind: "school", glyph: "⬢", label: "School", color: "#2D6A4F", description: "Schools & education" },
  college: { kind: "college", glyph: "△", label: "College", color: "#1E3A5F", description: "Campus & college events" },
  festival: { kind: "festival", glyph: "⬟", label: "Festival", color: "#BC4749", description: "Festivals & fairs" },
  chamber: { kind: "chamber", glyph: "⬡", label: "Chamber", color: "#7B3F00", description: "Chamber of commerce" },
  rotary: { kind: "rotary", glyph: "✧", label: "Rotary", color: "#0066B3", description: "Rotary club" },
  vfd: { kind: "vfd", glyph: "✹", label: "VFD", color: "#C1666B", description: "Volunteer fire department" },
  library: { kind: "library", glyph: "◇", label: "Library", color: "#40916C", description: "Public library" },
  farm_bureau: { kind: "farm_bureau", glyph: "⬣", label: "Farm Bureau", color: "#6B705C", description: "Agriculture & Farm Bureau" },
  extension: { kind: "extension", glyph: "◈", label: "Extension", color: "#588157", description: "Cooperative Extension / 4-H office" },
  homemakers: { kind: "homemakers", glyph: "◆", label: "Homemakers", color: "#A98467", description: "Extension Homemakers" },
  naacp: { kind: "naacp", glyph: "◐", label: "NAACP", color: "#1A1F2E", description: "NAACP chapter" },
  campaign: { kind: "campaign", glyph: "◉", label: "Campaign", color: "#1B4332", description: "Campaign activity (premium layer)" },
  business: { kind: "business", glyph: "▣", label: "Business", color: "#3D405B", description: "Local business" },
  nonprofit: { kind: "nonprofit", glyph: "◎", label: "Nonprofit", color: "#457B9D", description: "Nonprofit organization" },
  race: { kind: "race", glyph: "⟐", label: "Race", color: "#E07A5F", description: "Runs & races" },
  music: { kind: "music", glyph: "✺", label: "Music", color: "#9D4EDD", description: "Live music & concerts" },
  four_h: { kind: "four_h", glyph: "⬠", label: "4-H", color: "#4A7C59", description: "4-H & youth agriculture" },
  community: { kind: "community", glyph: "○", label: "Community", color: "#6C757D", description: "General community event" },
};

export function glyphForOrgType(orgType: string): CivicGlyphDef {
  const map: Record<string, HostGlyphKind> = {
    vfd: "vfd",
    rotary: "rotary",
    lions: "community",
    kiwanis: "community",
    farm_bureau: "farm_bureau",
    ffa: "four_h",
    four_h: "four_h",
    chamber: "chamber",
    library: "library",
    hospital: "nonprofit",
    community_center: "community",
    youth_sports: "race",
    extension_office: "extension",
    homemakers: "homemakers",
  };
  return CIVIC_GLYPHS[map[orgType] ?? "community"];
}

export function glyphForEventCategory(category: string, title = ""): CivicGlyphDef {
  const text = `${category} ${title}`.toLowerCase();
  if (category === "faith_meal" || category === "community_church") return CIVIC_GLYPHS.church;
  if (category === "school") return CIVIC_GLYPHS.school;
  if (category === "culture") return CIVIC_GLYPHS.music;
  if (category === "volunteer") return CIVIC_GLYPHS.nonprofit;
  if (category === "candidate_event") return CIVIC_GLYPHS.campaign;
  if (/parade|festival|fair|rodeo/i.test(text)) return CIVIC_GLYPHS.festival;
  if (/5k|10k|marathon|race|run/i.test(text)) return CIVIC_GLYPHS.race;
  if (/concert|music/i.test(text)) return CIVIC_GLYPHS.music;
  return CIVIC_GLYPHS.community;
}
