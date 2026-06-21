import type { CivicEvent } from "../types";
import { getEventPresence } from "../campaigns/presenceLayer";
import { getEventStudentServiceOpportunity } from "../student-service/studentServiceEngine";

export interface CalendarFilterState {
  county?: string;
  city?: string;
  category?: string;
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

  return list;
}

export function toggleCalendarFilter(
  filters: CalendarFilterState,
  key: keyof CalendarFilterState,
): CalendarFilterState {
  const next = { ...filters };
  if (key === "county" || key === "city" || key === "category") return next;
  next[key] = !next[key];
  return next;
}
