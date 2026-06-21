import type { HostGlyphKind } from "../glyphs/civicGlyphs";
import type { ServiceCategory } from "../student-service/studentServiceTypes";

export type HostPortalType =
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
  | "four_h"
  | "candidate"
  | "campaign"
  | "business"
  | "nonprofit"
  | "community";

export interface HostProfile {
  id: string;
  hostType: HostPortalType;
  displayName: string;
  organizationSlug?: string | null;
  county: string;
  city?: string | null;
  website?: string | null;
  volunteerPageUrl?: string | null;
  donationPageUrl?: string | null;
  contactEmail?: string | null;
  createdAt: string;
}

export interface HostEventVolunteerSettings {
  eventId: string;
  volunteersNeeded: boolean;
  advertisePublicly: boolean;
  volunteerSignupUrl?: string | null;
  volunteerNeededCount?: number | null;
  roleSummary?: string | null;
  studentServiceEligible?: boolean;
  estimatedServiceHours?: number | null;
  serviceCategory?: ServiceCategory | null;
  organizationSlug?: string | null;
  verifiedEntity?: boolean;
  updatedAt: string;
}

export const HOST_TYPE_LABELS: Record<HostPortalType, string> = {
  church: "Church",
  school: "School",
  college: "College",
  festival: "Festival organizer",
  chamber: "Chamber of Commerce",
  rotary: "Rotary club",
  vfd: "Volunteer fire department",
  library: "Library",
  farm_bureau: "Farm Bureau",
  extension: "Cooperative Extension",
  homemakers: "Extension Homemakers",
  naacp: "NAACP chapter",
  four_h: "4-H",
  candidate: "Political candidate",
  campaign: "Campaign organization",
  business: "Local business",
  nonprofit: "Nonprofit",
  community: "Community organization",
};

export function hostTypeToGlyphKind(type: HostPortalType): HostGlyphKind {
  const map: Record<HostPortalType, HostGlyphKind> = {
    church: "church",
    school: "school",
    college: "college",
    festival: "festival",
    chamber: "chamber",
    rotary: "rotary",
    vfd: "vfd",
    library: "library",
    farm_bureau: "farm_bureau",
    extension: "extension",
    homemakers: "homemakers",
    naacp: "naacp",
    four_h: "four_h",
    candidate: "campaign",
    campaign: "campaign",
    business: "business",
    nonprofit: "nonprofit",
    community: "community",
  };
  return map[type];
}
