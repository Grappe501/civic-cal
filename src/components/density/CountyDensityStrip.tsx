import type { CountyDensitySnapshot } from "../../lib/density/densityTypes";

interface Props {
  density: CountyDensitySnapshot;
}

export function CountyDensityStrip({ density }: Props) {
  const { institutions: inst, events: ev, coverageScore } = density;
  const sparse = coverageScore < 40 || ev.total < 12;

  return (
    <section
      className={`mb-8 rounded-xl border px-4 py-4 text-sm ${
        sparse ? "border-amber-300 bg-amber-50" : "border-ark-sage/40 bg-ark-porch/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Community density</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{coverageScore}% coverage</p>
          {sparse && (
            <p className="text-xs text-amber-950 mt-1 max-w-xl">
              Calendar still sparse for visitors — we track {inst.total} institutions but only {ev.total} events are indexed.
              Help us connect institution calendars to live listings.
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs">
          <div>
            <dt className="text-muted uppercase font-bold">Events</dt>
            <dd className="font-semibold text-lg">{ev.total}</dd>
            <dd className="text-muted">{ev.thisMonth} this month</dd>
          </div>
          <div>
            <dt className="text-muted uppercase font-bold">Organizations</dt>
            <dd className="font-semibold text-lg">{inst.total}</dd>
            <dd className="text-muted">{inst.churches} churches · {inst.schools} schools</dd>
          </div>
          <div>
            <dt className="text-muted uppercase font-bold">Traditions</dt>
            <dd className="font-semibold text-lg">{density.recurringTraditions}</dd>
            <dd className="text-muted">{density.volunteerOpportunities} volunteer opps</dd>
          </div>
          <div>
            <dt className="text-muted uppercase font-bold">Harvest pipeline</dt>
            <dd className="font-semibold text-lg">{density.projectedFutureEvents}</dd>
            <dd className="text-muted">projected feeds</dd>
          </div>
        </dl>
      </div>

      {density.gaps.length > 0 && sparse && (
        <ul className="mt-3 space-y-1 text-xs text-amber-950">
          {density.gaps.slice(0, 3).map((g) => (
            <li key={g.kind}>• {g.message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
