import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CivicEvent } from "../../lib/types";
import {
  eventsOnDate,
  formatCalendarDateParam,
  isSameDay,
  isSameMonth,
  monthGridDays,
} from "../../lib/calendar/calendarUtils";
import { selectVisibleCalendarEvents } from "../../lib/calendar/calendarDisplayPriority";
import { CalendarEventPill } from "./CalendarEventPill";
import { DayEventDrawer } from "./DayEventDrawer";
import { cn } from "../../lib/cn";

const MAX_VISIBLE = 3;

interface Props {
  anchor: Date;
  events: CivicEvent[];
}

export function MonthCalendarView({ anchor, events }: Props) {
  const days = monthGridDays(anchor);
  const [drawerDay, setDrawerDay] = useState<Date | null>(null);
  const drawerEvents = useMemo(
    () => (drawerDay ? eventsOnDate(events, drawerDay) : []),
    [drawerDay, events],
  );

  return (
    <>
      <div className="card-readable overflow-x-auto">
        <div className="grid grid-cols-7 gap-px min-w-[640px] bg-[var(--border)] rounded-xl overflow-hidden border border-[var(--border)]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-ark-wheat/60 px-2 py-2 text-center text-xs font-bold text-[var(--text-secondary)]">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dayEvents = eventsOnDate(events, day);
            const visibleEvents = selectVisibleCalendarEvents(dayEvents, MAX_VISIBLE, "month_cell");
            const inMonth = isSameMonth(day, anchor);
            const today = isSameDay(day, new Date());
            const extra = dayEvents.length - visibleEvents.length;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "bg-white min-h-[110px] p-1.5 flex flex-col gap-1",
                  !inMonth && "bg-ark-porch/80",
                  today && "ring-2 ring-inset ring-ark-rust/40",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "text-left text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center",
                    today ? "bg-ark-rust text-white" : "text-[var(--text-secondary)] hover:bg-ark-wheat",
                  )}
                  onClick={() => setDrawerDay(day)}
                >
                  {day.getDate()}
                </button>
                <div className="space-y-1 flex-1">
                  {visibleEvents.map((e) => (
                    <CalendarEventPill key={e.id} event={e} compact showDisplayPin />
                  ))}
                  {extra > 0 && (
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-ark-rust hover:underline w-full text-left"
                      onClick={() => setDrawerDay(day)}
                    >
                      +{extra} more
                    </button>
                  )}
                </div>
                <Link
                  to={`/calendar/day?date=${formatCalendarDateParam(day)}`}
                  className="text-[9px] text-muted-soft hover:underline"
                >
                  Day →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      {drawerDay && <DayEventDrawer date={drawerDay} events={drawerEvents} onClose={() => setDrawerDay(null)} />}
    </>
  );
}
