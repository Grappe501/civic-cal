import type { EventCategory } from "./types";

export const CATEGORIES: {
  id: EventCategory;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    id: "civic_meeting",
    label: "Civic meetings",
    description: "City council, quorum court, planning commission",
    color: "bg-ark-pine text-white",
  },
  {
    id: "candidate_event",
    label: "Candidate events",
    description: "Town halls, forums, meet-and-greets",
    color: "bg-ark-rust text-white",
  },
  {
    id: "community",
    label: "Community",
    description: "Festivals, parades, fairs, farmers markets",
    color: "bg-ark-sage text-white",
  },
  {
    id: "faith_meal",
    label: "Faith & meals",
    description: "Church dinners, fish fries, community meals",
    color: "bg-ark-clay text-white",
  },
  {
    id: "school",
    label: "Schools",
    description: "Games, board meetings, performances",
    color: "bg-ark-sky text-ark-night",
  },
  {
    id: "volunteer",
    label: "Volunteer",
    description: "Cleanups, food banks, mutual aid",
    color: "bg-emerald-700 text-white",
  },
  {
    id: "government_deadline",
    label: "Gov deadlines",
    description: "Filing dates, comment periods, hearings",
    color: "bg-slate-700 text-white",
  },
  {
    id: "culture",
    label: "Culture",
    description: "Music, art, library, historical society",
    color: "bg-violet-700 text-white",
  },
  {
    id: "small_business",
    label: "Small business",
    description: "Grand openings, markets, downtown events",
    color: "bg-amber-700 text-white",
  },
];

export function categoryLabel(id: EventCategory): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryColor(id: EventCategory): string {
  return CATEGORIES.find((c) => c.id === id)?.color ?? "bg-gray-600 text-white";
}
