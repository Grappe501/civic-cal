import type { CivicEvent } from "../types";

export type DistrictType =
  | "statewide"
  | "congressional"
  | "state_senate"
  | "state_house"
  | "county"
  | "city"
  | "school_district";

export type PlanStatus =
  | "considering"
  | "attending"
  | "skipping"
  | "needs_volunteers"
  | "candidate_should_attend";

export interface CampaignWorkspace {
  id: string;
  campaignName: string;
  candidateName?: string;
  officeSought?: string;
  districtType: DistrictType;
  districtName?: string;
  counties: string[];
  cities: string[];
  googleCalendarStatus: "not_connected" | "pending_oauth" | "connected";
  mobilizeStatus: "not_connected" | "pending" | "connected";
}

export interface CampaignEventPlan {
  eventId: string;
  planStatus: PlanStatus;
  candidateAttending: boolean;
  needsVolunteers: boolean;
  volunteerGoal?: number;
  staffingNotes?: string;
  travelNotes?: string;
}

const STORAGE_KEY = "civic-cal-demo-workspace";

export const DEMO_WORKSPACE: CampaignWorkspace = {
  id: "demo-arkansas-2026",
  campaignName: "Demo — Arkansas Civic Outreach",
  candidateName: "Sample Candidate",
  officeSought: "Statewide visibility (demo)",
  districtType: "statewide",
  districtName: "All Arkansas",
  counties: ["Conway", "Pulaski", "Faulkner", "Garland"],
  cities: ["Little Rock", "Morrilton", "Conway"],
  googleCalendarStatus: "not_connected",
  mobilizeStatus: "not_connected",
};

export function loadDemoWorkspace(): CampaignWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CampaignWorkspace;
  } catch (_) {}
  return { ...DEMO_WORKSPACE };
}

export function saveDemoWorkspace(ws: CampaignWorkspace): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
}

export function loadEventPlans(): Record<string, CampaignEventPlan> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-plans`);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {};
}

export function saveEventPlan(eventId: string, plan: CampaignEventPlan): void {
  const all = loadEventPlans();
  all[eventId] = plan;
  localStorage.setItem(`${STORAGE_KEY}-plans`, JSON.stringify(all));
}

export function filterEventsInDistrict(events: CivicEvent[], ws: CampaignWorkspace): CivicEvent[] {
  if (ws.districtType === "statewide") {
    if (!ws.counties.length) return events;
    return events.filter((e) => ws.counties.some((c) => c.toLowerCase() === e.county?.toLowerCase()));
  }
  if (ws.districtType === "county" && ws.counties.length) {
    return events.filter((e) => ws.counties.some((c) => c.toLowerCase() === e.county?.toLowerCase()));
  }
  if (ws.districtType === "city" && ws.cities.length) {
    return events.filter((e) => ws.cities.some((c) => e.city?.toLowerCase().includes(c.toLowerCase())));
  }
  return events.filter((e) => ws.counties.some((c) => c.toLowerCase() === e.county?.toLowerCase()));
}

export const DISTRICT_TYPE_LABELS: Record<DistrictType, string> = {
  statewide: "Statewide",
  congressional: "Congressional district",
  state_senate: "State Senate district",
  state_house: "State House district",
  county: "County",
  city: "City",
  school_district: "School district",
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  considering: "Considering",
  attending: "Attending",
  skipping: "Skipping",
  needs_volunteers: "Needs volunteer team",
  candidate_should_attend: "Candidate should attend",
};
