export type DossierVerificationStatus = "needs_review" | "verified" | "low_confidence" | "rejected";

export type ResearchTaskStatus = "open" | "in_progress" | "done" | "blocked";

export type SourceLinkType =
  | "official_event_site"
  | "city_calendar"
  | "county_calendar"
  | "church_parish"
  | "public_facebook"
  | "chamber_tourism"
  | "school_page"
  | "newspaper"
  | "eventbrite"
  | "library_calendar"
  | "fair_festival"
  | "other";

export interface DossierSourceLink {
  type: SourceLinkType | string;
  label: string;
  url: string;
  trust?: "high" | "medium" | "low";
}

export interface HostContact {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
}

export interface EventIntelligenceDossier {
  id?: string;
  eventId: string;
  hostOrganization?: string | null;
  hostContacts?: HostContact[];
  officialWebsite?: string | null;
  socialLinks?: { platform: string; url: string }[];
  sourceLinks?: DossierSourceLink[];
  ticketCost?: string | null;
  vendorOptions?: string | null;
  sponsorOptions?: string | null;
  parkingInfo?: string | null;
  accessibilityInfo?: string | null;
  indoorOutdoor?: string | null;
  foodAvailable?: string | null;
  restroomInfo?: string | null;
  familyFriendly?: boolean | null;
  expectedAttendanceMin?: number | null;
  expectedAttendanceMax?: number | null;
  historicalNotes?: string | null;
  yearsRunning?: number | null;
  recurringPattern?: string | null;
  candidateGuidance?: string | null;
  volunteerGuidance?: string | null;
  localCustoms?: string | null;
  whatToWear?: string | null;
  arrivalAdvice?: string | null;
  bestTimeToArrive?: string | null;
  campaignRiskNotes?: string | null;
  eventFormat?: string | null;
  unansweredQuestions?: string[];
  confirmedFacts?: string[];
  likelyInferences?: string[];
  verificationStatus: DossierVerificationStatus;
  confidenceScore: number;
  lastResearchedAt?: string | null;
}

export interface EventResearchTask {
  id?: string;
  eventId: string;
  taskType: string;
  taskLabel: string;
  status: ResearchTaskStatus;
  assignedTo?: string | null;
  resultNotes?: string | null;
  sourceUrl?: string | null;
}

export interface EventDossierBundle {
  dossier: EventIntelligenceDossier;
  tasks: EventResearchTask[];
  source: "database" | "deterministic";
}

export const DEFAULT_RESEARCH_TASKS: { taskType: string; taskLabel: string }[] = [
  { taskType: "verify_datetime", taskLabel: "Verify date and time from official source" },
  { taskType: "host_contact", taskLabel: "Find host contact (name, email, or phone)" },
  { taskType: "parking", taskLabel: "Confirm parking availability and instructions" },
  { taskType: "accessibility", taskLabel: "Confirm accessibility (ramps, seating, ADA)" },
  { taskType: "cost", taskLabel: "Confirm ticket or meal cost" },
  { taskType: "vendor_info", taskLabel: "Confirm vendor or booth options" },
  { taskType: "attendance_history", taskLabel: "Confirm typical crowd size and attendance history" },
  { taskType: "officials_attend", taskLabel: "Confirm whether public officials usually attend" },
];

export const ALLOWED_SOURCE_TYPES: SourceLinkType[] = [
  "official_event_site",
  "city_calendar",
  "county_calendar",
  "church_parish",
  "public_facebook",
  "chamber_tourism",
  "school_page",
  "newspaper",
  "eventbrite",
  "library_calendar",
  "fair_festival",
  "other",
];
