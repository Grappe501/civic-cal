import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, PlusCircle, Share2 } from "lucide-react";
import type { CivicEvent } from "../../lib/types";
import { eventsOnDate, formatCalendarDateParam, groupDayEvents } from "../../lib/calendar/calendarUtils";
import { CalendarEventPill } from "./CalendarEventPill";
import { eventHasMapPin } from "../../lib/maps/mapTypes";
import { ArkansasEventMap } from "../maps/ArkansasEventMap";

interface Props {
  date: Date;
  events: CivicEvent[];
}

const PART_LABELS = {
  "all-day": "All day",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
} as const;

export function DayCalendarView({ date, events }: Props) {
  const dayEvents = useMemo(() => eventsOnDate(events, date), [events, date]);
  const groups = useMemo(() => groupDayEvents(dayEvents), [dayEvents]);
  const mappable = dayEvents.filter(eventHasMapPin);
  const param = formatCalendarDateParam(date);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/calendar/day?date=${param}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link to={`/submit?date=${param}`} className="btn-primary text-sm">
          <PlusCircle className="h-4 w-4" /> Submit event for this day
        </Link>
        {shareUrl && (
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => navigator.clipboard?.writeText(shareUrl)}
          >
            <Share2 className="h-4 w-4" /> Share this day
          </button>
        )}
      </div>

      {(["all-day", "morning", "afternoon", "evening"] as const).map((part) => (
        <section key={part} className="card-readable">
          <h2 className="text-kicker">{PART_LABELS[part]}</h2>
          <ul className="mt-3 space-y-2 border-l-2 border-ark-wheat pl-4">
            {groups[part].map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[1.35rem] top-3 h-2.5 w-2.5 rounded-full bg-ark-rust border-2 border-white" aria-hidden />
                <CalendarEventPill event={e} />
              </li>
            ))}
            {groups[part].length === 0 && <li className="text-muted text-sm">Nothing scheduled</li>}
          </ul>
        </section>
      ))}

      {mappable.length > 0 && (
        <section className="card-readable">
          <h2 className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Map for this day
          </h2>
          <div className="mt-3 h-[320px] rounded-xl overflow-hidden border border-[var(--border)]">
            <ArkansasEventMap events={mappable} height="320px" compact />
          </div>
        </section>
      )}
    </div>
  );
}
