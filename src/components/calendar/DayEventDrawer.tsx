import { Link } from "react-router-dom";
import { X } from "lucide-react";
import type { CivicEvent } from "../../lib/types";
import { formatCalendarDateParam } from "../../lib/calendar/calendarUtils";
import { CalendarEventPill } from "./CalendarEventPill";
import { formatInTimeZone } from "date-fns-tz";
import { CALENDAR_TZ } from "../../lib/calendar/calendarUtils";

interface Props {
  date: Date;
  events: CivicEvent[];
  onClose: () => void;
}

export function DayEventDrawer({ date, events, onClose }: Props) {
  const label = formatInTimeZone(date, CALENDAR_TZ, "EEEE, MMMM d, yyyy");
  const param = formatCalendarDateParam(date);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label={`Events on ${label}`}>
      <button type="button" className="absolute inset-0 bg-ark-night/40" onClick={onClose} aria-label="Close drawer" />
      <aside className="relative w-full max-w-md bg-white shadow-xl border-l border-[var(--border)] p-5 overflow-y-auto max-h-full">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-[var(--text-secondary)]">{label}</h2>
            <p className="text-muted-soft text-sm">{events.length} events</p>
          </div>
          <button type="button" className="btn-ghost p-2" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Link to={`/calendar/day?date=${param}`} className="btn-primary text-xs">
            Open day view
          </Link>
          <Link to={`/submit?date=${param}`} className="btn-secondary text-xs">
            Submit event
          </Link>
        </div>
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id}>
              <CalendarEventPill event={e} />
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-muted text-sm panel-light">No events this day — try widening filters or submit one.</li>
          )}
        </ul>
      </aside>
    </div>
  );
}
