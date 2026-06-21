/** Institution relationship tracking — institutions, not individuals */

export type InstitutionRelationKind =
  | "rotary"
  | "naacp"
  | "farm_bureau"
  | "vfw"
  | "chamber"
  | "church"
  | "school_district"
  | "library"
  | "vfd"
  | "lions"
  | "kiwanis"
  | "ffa"
  | "extension_office"
  | "homemakers";

export type RelationshipScoreLabel = "low" | "developing" | "strong";

export interface InstitutionTouchpoint {
  id: string;
  workspaceSlug: string;
  institutionId: string;
  institutionName: string;
  kind: InstitutionRelationKind;
  county: string;
  city?: string;
  eventId?: string;
  eventTitle?: string;
  attendedAt: string;
  note?: string;
}

export interface InstitutionRelationshipStatus {
  institutionId: string;
  institutionName: string;
  kind: InstitutionRelationKind;
  county: string;
  city?: string;
  eventsAttended: number;
  lastAttendedAt?: string;
  lastEventTitle?: string;
  relationshipScore: number;
  scoreLabel: RelationshipScoreLabel;
  recommendedAction?: string;
}

export const INSTITUTION_KIND_LABELS: Record<InstitutionRelationKind, string> = {
  rotary: "Rotary",
  naacp: "NAACP",
  farm_bureau: "Farm Bureau",
  vfw: "VFW",
  chamber: "Chamber",
  church: "Church",
  school_district: "School district",
  library: "Library",
  vfd: "Volunteer fire department",
  lions: "Lions Club",
  kiwanis: "Kiwanis",
  ffa: "FFA",
  extension_office: "Cooperative Extension",
  homemakers: "Extension Homemakers",
};
