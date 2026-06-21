import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { CivicEvent } from "../types";
import { DEFAULT_EVENT_TIMEZONE } from "../events/eventArchive";
import { comparePublicCalendarEvents } from "./publicCalendarSort";

export const CALENDAR_TZ = DEFAULT_EVENT_TIMEZONE;

export type CalendarView = "day" | "week" | "month";

export function parseCalendarDate(raw: string | null, fallback = new Date()): Date {
  if (!raw) return fallback;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return fallback;
  return new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00`);
}

export function formatCalendarDateParam(d: Date): string {
  return formatInTimeZone(d, CALENDAR_TZ, "yyyy-MM-dd");
}

export function eventLocalDateKey(event: CivicEvent): string {
  return formatInTimeZone(parseISO(event.startAt), event.timezone || CALENDAR_TZ, "yyyy-MM-dd");
}

export function eventsOnDate(events: CivicEvent[], day: Date): CivicEvent[] {
  const key = formatCalendarDateParam(day);
  return events.filter((e) => eventLocalDateKey(e) === key).sort(comparePublicCalendarEvents);
}

export function monthGridDays(anchor: Date): Date[] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export type DayPart = "all-day" | "morning" | "afternoon" | "evening";

export function eventDayPart(event: CivicEvent): DayPart {
  if (event.allDay) return "all-day";
  const hour = Number(formatInTimeZone(parseISO(event.startAt), event.timezone || CALENDAR_TZ, "H"));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function groupDayEvents(events: CivicEvent[]): Record<DayPart, CivicEvent[]> {
  const groups: Record<DayPart, CivicEvent[]> = {
    "all-day": [],
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const e of events) groups[eventDayPart(e)].push(e);
  for (const k of Object.keys(groups) as DayPart[]) {
    groups[k].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }
  return groups;
}

export function navigateDate(view: CalendarView, date: Date, dir: -1 | 1): Date {
  if (view === "day") return dir === 1 ? addDays(date, 1) : subDays(date, 1);
  if (view === "week") return dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
  return dir === 1 ? addMonths(date, 1) : subMonths(date, 1);
}

export function viewTitle(view: CalendarView, date: Date): string {
  if (view === "day") return formatInTimeZone(date, CALENDAR_TZ, "EEEE, MMMM d, yyyy");
  if (view === "week") {
    const days = weekDays(date);
    const a = format(days[0], "MMM d");
    const b = format(days[6], "MMM d, yyyy");
    return `${a} – ${b}`;
  }
  return formatInTimeZone(date, CALENDAR_TZ, "MMMM yyyy");
}

export { isSameDay, isSameMonth, isWeekend, format };
