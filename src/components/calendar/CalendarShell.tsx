import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { AlertTriangle, Database } from "lucide-react";
import { fetchEventsWithMeta } from "../../lib/api";
import { applyCalendarFilters, type CalendarFilterState } from "../../lib/calendar/calendarFilters";
import { parseCalendarDate, type CalendarView } from "../../lib/calendar/calendarUtils";
import type { CivicEvent } from "../../lib/types";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarFilters } from "./CalendarFilters";
import { MonthCalendarView } from "./MonthCalendarView";
import { WeekCalendarView } from "./WeekCalendarView";
import { DayCalendarView } from "./DayCalendarView";

function viewFromPath(pathname: string): CalendarView {
  if (pathname.includes("/day")) return "day";
  if (pathname.includes("/week")) return "week";
  return "month";
}

export function CalendarShell({ defaultView }: { defaultView?: CalendarView }) {
  const location = useLocation();
  const [params] = useSearchParams();
  const view = defaultView ?? viewFromPath(location.pathname);
  const anchor = parseCalendarDate(params.get("date"));

  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [source, setSource] = useState<string>("loading");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CalendarFilterState>({});

  useEffect(() => {
    setLoading(true);
    fetchEventsWithMeta({ limit: 500 })
      .then(({ events: list, source: s }) => {
        setEvents(list);
        setSource(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => applyCalendarFilters(events, filters), [events, filters]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <CalendarToolbar view={view} date={anchor} eventCount={filtered.length} />
      <CalendarFilters filters={filters} onChange={setFilters} />

      {loading && <p className="text-muted">Loading calendar…</p>}

      {!loading && filtered.length === 0 && (
        <div className="card-readable border-amber-300 bg-amber-50 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-950">
            <p className="font-semibold">No visible events match your filters.</p>
            <p className="mt-1 text-muted">
              Data source: <strong>{source}</strong>. Admins can inspect{" "}
              <Link to="/admin/data-health" className="text-ark-rust underline font-medium">
                data health
              </Link>{" "}
              for diagnostics.
            </p>
            <Link to="/submit" className="btn-primary text-xs mt-3 inline-flex">
              Submit an event
            </Link>
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && source !== "database" && (
        <p className="text-caption flex items-center gap-1">
          <Database className="h-3 w-3" aria-hidden />
          Showing bundled seed/demo data ({source}) — live DB events appear when imported.
        </p>
      )}

      {!loading && view === "month" && <MonthCalendarView anchor={anchor} events={filtered} />}
      {!loading && view === "week" && <WeekCalendarView anchor={anchor} events={filtered} />}
      {!loading && view === "day" && <DayCalendarView date={anchor} events={filtered} />}
    </div>
  );
}

export function CalendarIndexPage() {
  const [params] = useSearchParams();
  const q = params.toString();
  return <Navigate to={`/calendar/month${q ? `?${q}` : ""}`} replace />;
}

export function CalendarDayPage() {
  return <CalendarShell defaultView="day" />;
}

export function CalendarWeekPage() {
  return <CalendarShell defaultView="week" />;
}

export function CalendarMonthPage() {
  return <CalendarShell defaultView="month" />;
}
