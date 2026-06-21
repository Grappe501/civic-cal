import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { CivicEvent } from "../../lib/types";
import { CALENDAR_TZ, eventsOnDate, groupDayEvents, isWeekend, weekDays } from "../../lib/calendar/calendarUtils";
import { selectPublicCalendarHighlights } from "../../lib/calendar/publicCalendarSort";
import { CalendarEventPill } from "./CalendarEventPill";
import { cn } from "../../lib/cn";
import { formatInTimeZone } from "date-fns-tz";

interface Props {
  anchor: Date;
  events: CivicEvent[];
}

export function WeekCalendarView({ anchor, events }: Props) {
  const days = weekDays(anchor);

  const featured = useMemo(() => selectPublicCalendarHighlights(events, 5), [events]);

  return (
    <div className="space-y-4">
      {featured.length > 0 && (
        <section className="card-readable border-l-4 border-ark-rust">
          <h2 className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ark-rust" /> Featured community events this week
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {featured.map((e) => (
              <li key={e.id} className="min-w-[140px] flex-1">
                <CalendarEventPill event={e} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="hidden md:grid md:grid-cols-7 gap-2">
        {days.map((day) => {
          const dayEvents = eventsOnDate(events, day);
          const groups = groupDayEvents(dayEvents);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "card-readable min-h-[200px] p-2",
                isWeekend(day) && "bg-ark-wheat/40",
              )}
            >
              <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">
                {formatInTimeZone(day, CALENDAR_TZ, "EEE d")}
              </p>
              {(["all-day", "morning", "afternoon", "evening"] as const).map((part) =>
                groups[part].length > 0 ? (
                  <div key={part} className="mb-2">
                    <p className="text-[9px] uppercase text-muted-soft font-bold">{part}</p>
                    <ul className="space-y-1 mt-0.5">
                      {groups[part].map((e) => (
                        <li key={e.id}>
                          <CalendarEventPill event={e} compact />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
              {dayEvents.length === 0 && <p className="text-caption">—</p>}
            </div>
          );
        })}
      </div>

      <div className="md:hidden space-y-3">
        {days.map((day) => {
          const dayEvents = eventsOnDate(events, day);
          return (
            <section key={day.toISOString()} className={cn("card-readable", isWeekend(day) && "bg-ark-wheat/40")}>
              <h3 className="font-semibold text-sm text-[var(--text-secondary)]">
                {formatInTimeZone(day, CALENDAR_TZ, "EEEE, MMM d")}
              </h3>
              <ul className="mt-2 space-y-2">
                {dayEvents.map((e) => (
                  <li key={e.id}>
                    <CalendarEventPill event={e} />
                  </li>
                ))}
                {dayEvents.length === 0 && <li className="text-muted text-sm">No events</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
