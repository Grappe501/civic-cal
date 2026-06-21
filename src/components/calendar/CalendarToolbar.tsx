import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarView } from "../../lib/calendar/calendarUtils";
import { formatCalendarDateParam, navigateDate, viewTitle } from "../../lib/calendar/calendarUtils";
import { cn } from "../../lib/cn";

interface Props {
  view: CalendarView;
  date: Date;
  eventCount: number;
}

const VIEWS: { id: CalendarView; label: string; path: string }[] = [
  { id: "day", label: "Day", path: "/calendar/day" },
  { id: "week", label: "Week", path: "/calendar/week" },
  { id: "month", label: "Month", path: "/calendar/month" },
];

export function CalendarToolbar({ view, date, eventCount }: Props) {
  const navigate = useNavigate();
  const param = formatCalendarDateParam(date);

  function go(d: Date) {
    navigate(`${VIEWS.find((v) => v.id === view)!.path}?date=${formatCalendarDateParam(d)}`);
  }

  return (
    <div className="card-readable space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-kicker">Arkansas community calendar</p>
          <h1 className="page-header text-2xl md:text-3xl mt-1">{viewTitle(view, date)}</h1>
          <p className="text-muted-soft text-sm mt-1">{eventCount} events in view</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              to={`${v.path}?date=${param}`}
              className={cn("chip text-xs", view === v.id ? "chip-active" : "chip-muted")}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={() => go(navigateDate(view, date, -1))} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={() => go(new Date())}>
          Today
        </button>
        <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={() => go(navigateDate(view, date, 1))} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </button>
        <input
          type="date"
          className="input-readable text-xs max-w-[160px]"
          value={param}
          onChange={(e) => go(new Date(`${e.target.value}T12:00:00`))}
          aria-label="Pick date"
        />
        <Link to={`/calendar/day?date=${param}`} className="btn-ghost text-xs">
          Jump to day
        </Link>
      </div>
    </div>
  );
}
