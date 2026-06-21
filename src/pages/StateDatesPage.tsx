import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  filterStateDates,
  stateDateCategoryLabel,
  sourceRegistry,
  harvestTasks,
  datesPolicy,
} from "../lib/state-dates/stateDatesRegistry";

const CATEGORIES = [
  "elections",
  "voter_registration",
  "early_voting",
  "hunting_season",
  "fishing_season",
  "school_calendar",
  "state_holiday",
  "agriculture_fair_season",
  "civic_deadline",
];

export function StateDatesPage() {
  const [category, setCategory] = useState("");
  const [showUnverified, setShowUnverified] = useState(false);

  useEffect(() => {
    document.title = "Important Arkansas Dates | Arkansas Everywhere";
  }, []);

  const dates = useMemo(
    () =>
      filterStateDates({
        category: category || undefined,
        verifiedOnly: !showUnverified,
      }),
    [category, showUnverified],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-ark-sage font-medium uppercase tracking-wide">Arkansas statewide calendar</p>
      <h1 className="font-display text-3xl font-bold text-ark-pine mt-1 flex items-center gap-2">
        <CalendarDays className="h-8 w-8" /> Important Arkansas dates
      </h1>
      <p className="text-sm text-muted mt-2 max-w-2xl">{datesPolicy()}</p>

      <div className="flex flex-wrap gap-3 mt-6 mb-8">
        <select className="input text-sm max-w-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{stateDateCategoryLabel(c)}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showUnverified} onChange={(e) => setShowUnverified(e.target.checked)} />
          Show needs-review (not verified for display elsewhere)
        </label>
      </div>

      <div className="space-y-3">
        {dates.map((d) => (
          <article key={d.id} className="card flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-ark-pine">{d.title}</h2>
              <p className="text-xs text-muted mt-0.5">
                {stateDateCategoryLabel(d.category)}
                {d.subcategory && ` · ${d.subcategory}`}
                {d.species && ` · ${d.species}`}
                {d.seasonYear && ` · ${d.seasonYear}`}
              </p>
              {d.notes && <p className="text-sm text-muted mt-2">{d.notes}</p>}
            </div>
            <div className="text-right text-sm">
              <time dateTime={d.date} className="font-medium text-ark-pine block">
                {format(parseISO(d.date), "MMMM d, yyyy")}
                {d.endDate && d.endDate !== d.date && ` – ${format(parseISO(d.endDate), "MMM d, yyyy")}`}
              </time>
              <span className={`text-xs ${d.verificationStatus === "verified" ? "text-emerald-700" : "text-amber-700"}`}>
                {d.verificationStatus}
              </span>
              <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-ark-sage hover:underline flex items-center justify-end gap-1 mt-1">
                {d.sourceName} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </article>
        ))}
        {dates.length === 0 && <p className="text-muted">No dates in this filter.</p>}
      </div>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold">Official source registry</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {sourceRegistry().map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-ark-sage hover:underline">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold">Harvest tasks (pending dates)</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {harvestTasks().map((t) => (
              <li key={t.id}>• {t.title} <span className="text-xs text-amber-700">({t.status})</span></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
