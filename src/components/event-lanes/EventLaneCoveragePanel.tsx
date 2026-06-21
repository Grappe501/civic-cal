import type { GeoLaneCoverage } from "../../lib/event-lanes/laneTypes";

interface Props {
  coverage: GeoLaneCoverage;
  compact?: boolean;
}

const STATUS_CLASS: Record<string, string> = {
  filled: "badge-success",
  thin: "badge-info",
  ready_for_harvest: "badge-warning",
  missing: "badge-warning",
};

export function EventLaneCoveragePanel({ coverage, compact = false }: Props) {
  const lanesToShow = compact
    ? coverage.lanes.filter((l) =>
        ["government_civic", "schools", "churches", "community_anchors", "vfds", "festivals", "sports", "food_trail"].includes(l.laneId),
      )
    : coverage.lanes;

  return (
    <section className="card-readable mb-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Event lane coverage</p>
          <h2 className="font-semibold text-[var(--text-secondary)]">
            {coverage.geoType === "city" ? `${coverage.city}, ${coverage.county} County` : `${coverage.county} County`}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{coverage.overallCoverage}%</p>
          <p className="text-xs text-muted">Phase 1 lanes: {coverage.phase1Coverage}%</p>
        </div>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {lanesToShow.map((lane) => (
          <li
            key={lane.laneId}
            className="rounded-lg border border-ark-sage/30 px-3 py-2 text-sm"
            title={`${lane.eventsIndexed} events · ${lane.sourcesOnFile} sources · ${lane.institutionsTracked} institutions`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-xs">{lane.shortName}</span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${STATUS_CLASS[lane.status] ?? "badge-info"}`}>
                {lane.coveragePercent}%
              </span>
            </div>
            {!compact && (
              <p className="text-[10px] text-muted mt-1 capitalize">{lane.status.replace(/_/g, " ")}</p>
            )}
          </li>
        ))}
      </ul>

      {coverage.overallCoverage < 50 && (
        <p className="text-xs text-muted mt-3">
          Coverage operation in progress — lanes marked thin or missing need institution calendar harvest.{" "}
          <a href="/help-build-the-calendar" className="text-ark-rust hover:underline">
            Report a source
          </a>
        </p>
      )}
    </section>
  );
}
