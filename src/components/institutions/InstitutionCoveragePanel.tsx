import type { InstitutionCoverageRow } from "../../lib/institutions/types";

interface Props {
  coverage: InstitutionCoverageRow[];
}

export function InstitutionCoveragePanel({ coverage }: Props) {
  return (
    <section className="card card-elevated">
      <h2 className="intel-section-title">Event source coverage</h2>
      <p className="text-xs text-muted mt-1 mb-4">Roadmap for Burt — known vs verified institutions per county</p>
      <div className="space-y-3">
        {coverage.map((row) => (
          <div key={row.type}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-ark-pine">{row.label}</span>
              <span className="text-muted text-xs">
                {row.known} known · {row.verified} verified · {row.coveragePercent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-ark-wheat overflow-hidden">
              <div
                className="h-full rounded-full bg-ark-sage transition-all"
                style={{ width: `${Math.max(row.coveragePercent, row.known > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
