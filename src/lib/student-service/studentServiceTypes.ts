export type ServiceCategory =
  | "food_pantry"
  | "library"
  | "festival_volunteer"
  | "race_volunteer"
  | "vfd_fundraiser"
  | "school_event"
  | "church_community_meal"
  | "senior_center"
  | "cleanup"
  | "four_h_extension"
  | "civic_organization";

export type VerificationStatus = "verified" | "needs_review" | "rejected";

export interface StudentServiceOpportunity {
  id: string;
  eventId?: string | null;
  organizationSlug?: string | null;
  organizationId?: string | null;
  title: string;
  description?: string | null;
  city?: string | null;
  county: string;
  serviceCategory: ServiceCategory;
  eligibleGrades?: string | null;
  estimatedHours?: number | null;
  recurring?: boolean;
  verifiedEntity: boolean;
  verificationStatus: VerificationStatus;
  signupUrl?: string | null;
  contactUrl?: string | null;
  sourceUrl?: string | null;
  notes?: string | null;
}

export interface StudentServiceInterest {
  id: string;
  opportunityId: string;
  studentFirstName?: string | null;
  parentGuardianEmail?: string | null;
  schoolName?: string | null;
  city?: string | null;
  county?: string | null;
  requestedHours?: number | null;
  message?: string | null;
  status: "submitted" | "routed" | "closed";
  createdAt: string;
}

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  food_pantry: "Food pantry",
  library: "Library",
  festival_volunteer: "Festival volunteer",
  race_volunteer: "Race volunteer",
  vfd_fundraiser: "VFD fundraiser",
  school_event: "School event",
  church_community_meal: "Church / community meal",
  senior_center: "Senior center",
  cleanup: "Cleanup",
  four_h_extension: "4-H / Extension",
  civic_organization: "Civic organization",
};

export const ARKANSAS_SERVICE_HOUR_REQUIREMENT = {
  hours: 75,
  grades: "9–12",
  effectiveClass: "2026–2027 graduating class onward",
  ruleUrl: "https://codeofarrules.arkansas.gov/Rules/Rule?chapterID=47&levelType=section&partID=1104&sectionID=35239",
};
