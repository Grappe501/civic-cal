import type { CivicEvent } from "../types";
import { getEventPresence } from "../campaigns/presenceLayer";
import { getEventStudentServiceOpportunity } from "../student-service/studentServiceEngine";
import { sortPublicCalendarEvents } from "./publicCalendarSort";

export interface CalendarFilterState {
  county?: string;
  city?: string;
  category?: string;
  partyLabel?: string;
  partyMeeting?: boolean;
  volunteer?: boolean;
  studentService?: boolean;
  candidateAttending?: boolean;
  church?: boolean;
  food?: boolean;
  festival?: boolean;
  race?: boolean;
  music?: boolean;
}

export const CALENDAR_FILTER_CHIPS: { id: keyof CalendarFilterState; label: string }[] = [
  { id: "partyMeeting", label: "County party meetings" },
  { id: "volunteer", label: "Volunteer" },
  { id: "studentService", label: "Student service" },
  { id: "candidateAttending", label: "Candidate attending" },
  { id: "church", label: "Church meals" },
  { id: "food", label: "Food trucks" },
  { id: "festival", label: "Festivals" },
  { id: "race", label: "Races" },
  { id: "music", label: "Music" },
];

export function applyCalendarFilters(events: CivicEvent[], filters: CalendarFilterState): CivicEvent[] {
  let list = events;

  if (filters.county) {
    list = list.filter((e) => e.county?.toLowerCase() === filters.county!.toLowerCase());
  }
  if (filters.city) {
    const q = filters.city.toLowerCase();
    list = list.filter((e) => e.city?.toLowerCase().includes(q));
  }
  if (filters.category) {
    list = list.filter((e) => e.category === filters.category);
  }
  if (filters.partyMeeting) {
    list = list.filter((e) => e.category === "public_party_meeting");
  }
  if (filters.partyLabel) {
    list = list.filter((e) => e.partyLabel === filters.partyLabel);
  }
  if (filters.volunteer) {
    list = list.filter((e) => e.category === "volunteer");
  }
  if (filters.studentService) {
    list = list.filter((e) => getEventStudentServiceOpportunity(e) != null);
  }
  if (filters.candidateAttending) {
    list = list.filter((e) => {
      const p = getEventPresence(e.id);
      return p.attendingCampaigns.length > 0 || p.surrogatePlans.length > 0;
    });
  }
  if (filters.church) {
    list = list.filter((e) => e.category === "faith_meal" || e.category === "community_church");
  }
  if (filters.food) {
    list = list.filter((e) => e.category === "food_truck_festival" || /food truck/i.test(e.title));
  }
  if (filters.festival) {
    list = list.filter(
      (e) =>
        e.category === "community" ||
        e.category === "food_truck_festival" ||
        /festival|fair|parade/i.test(e.title),
    );
  }
  if (filters.race) {
    list = list.filter((e) => /5k|10k|marathon|race|run|turkey trot/i.test(e.title));
  }
  if (filters.music) {
    list = list.filter((e) => e.category === "culture" || /concert|music|live music/i.test(e.title));
  }

  return sortPublicCalendarEvents(list);
}

export function toggleCalendarFilter(
  filters: CalendarFilterState,
  key: keyof CalendarFilterState,
): CalendarFilterState {
  const next = { ...filters };
  if (key === "county" || key === "city" || key === "category" || key === "partyLabel") return next;
  if (key === "partyMeeting" && !next.partyMeeting) {
    next.partyMeeting = true;
    next.category = "public_party_meeting";
    return next;
  }
  if (key === "partyMeeting" && next.partyMeeting) {
    next.partyMeeting = false;
    if (next.category === "public_party_meeting") next.category = undefined;
    return next;
  }
  next[key] = !next[key];
  return next;
}

export function calendarFiltersFromSearchParams(params: URLSearchParams): CalendarFilterState {
  const filters: CalendarFilterState = {};
  const county = params.get("county");
  const city = params.get("city");
  const category = params.get("category");
  const party = params.get("party") || params.get("partyLabel");
  if (county) filters.county = county;
  if (city) filters.city = city;
  if (category) filters.category = category;
  if (party) filters.partyLabel = party;
  if (category === "public_party_meeting" || params.get("partyMeeting") === "1") {
    filters.partyMeeting = true;
    filters.category = "public_party_meeting";
  }
  return filters;
}

export function calendarFiltersToSearchParams(filters: CalendarFilterState, existing: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(existing);
  if (filters.county) p.set("county", filters.county);
  else p.delete("county");
  if (filters.city) p.set("city", filters.city);
  else p.delete("city");
  if (filters.category) p.set("category", filters.category);
  else p.delete("category");
  if (filters.partyLabel) p.set("party", filters.partyLabel);
  else p.delete("party");
  if (filters.partyMeeting) p.set("partyMeeting", "1");
  else p.delete("partyMeeting");
  return p;
}
