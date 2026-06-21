import { format, parseISO } from "date-fns";
import { CalendarDays, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { StateCalendarDate } from "../../lib/state-dates/stateDatesRegistry";
import { stateDateCategoryLabel } from "../../lib/state-dates/stateDatesRegistry";

interface Props {
  dates: StateCalendarDate[];
  title?: string;
  compact?: boolean;
}

export function ImportantArkansasDatesBlock({ dates, title = "Important Arkansas dates", compact }: Props) {
  if (dates.length === 0) return null;

  return (
    <section className={compact ? "card bg-ark-wheat/40" : "card bg-ark-wheat/30 mb-8"}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold flex items-center gap-2 text-ark-pine">
          <CalendarDays className="h-4 w-4" /> {title}
        </h2>
        <Link to="/calendar/dates" className="text-xs text-ark-rust hover:underline">Full calendar</Link>
      </div>
      <ul className="space-y-2">
        {dates.map((d) => (
          <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm border-b border-ark-pine/5 pb-2 last:border-0">
            <div>
              <span className="font-medium text-ark-pine">{d.title}</span>
              <span className="text-xs text-muted ml-2">{stateDateCategoryLabel(d.category)}</span>
            </div>
            <div className="text-xs text-muted flex items-center gap-2">
              <time dateTime={d.date}>
                {format(parseISO(d.date), "MMM d, yyyy")}
                {d.endDate && d.endDate !== d.date && ` – ${format(parseISO(d.endDate), "MMM d")}`}
              </time>
              <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-ark-sage hover:underline inline-flex items-center gap-0.5" title={d.sourceName}>
                Source <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StatewideDatesWatchPanel({ dates }: { dates: StateCalendarDate[] }) {
  return (
    <section className="card border-ark-rust/20 bg-ark-wheat/20">
      <h3 className="font-semibold text-sm text-ark-pine">Statewide dates to watch</h3>
      <p className="text-xs text-muted mt-1">Elections, civic deadlines, and sourced season references — official sources linked.</p>
      <ImportantArkansasDatesBlock dates={dates.slice(0, 6)} title="" compact />
    </section>
  );
}
