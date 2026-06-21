import { ExternalLink, History } from "lucide-react";
import type { HistoricPoliticalHistoryDossier } from "../../lib/political-events/historicPoliticalEvents";

interface Props {
  dossier: HistoricPoliticalHistoryDossier;
}

export function PoliticalEventHistorySection({ dossier }: Props) {
  return (
    <section className="dossier-section card card-elevated border-l-4 border-l-ark-rust">
      <h2 className="dossier-section-title">
        <History className="h-5 w-5 text-ark-rust shrink-0" />
        About &amp; history
      </h2>
      <p className="text-xs text-muted mb-4">
        Source-backed civic-political context — neutral labeling, no endorsements. Confirm current details at official sources.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 text-sm">
        {dossier.firstYearHeld != null && (
          <div>
            <dt className="text-kicker">First year held</dt>
            <dd className="font-medium">{dossier.firstYearHeld}</dd>
          </div>
        )}
        {dossier.honors && (
          <div>
            <dt className="text-kicker">Honors</dt>
            <dd>{dossier.honors}</dd>
          </div>
        )}
        {dossier.hostOrganization && (
          <div>
            <dt className="text-kicker">Host organization</dt>
            <dd>{dossier.hostOrganization}</dd>
          </div>
        )}
        {dossier.typicalAudience && (
          <div className="sm:col-span-2">
            <dt className="text-kicker">Typical audience</dt>
            <dd>{dossier.typicalAudience}</dd>
          </div>
        )}
        {dossier.recurringPattern && (
          <div className="sm:col-span-2">
            <dt className="text-kicker">Recurrence</dt>
            <dd>{dossier.recurringPattern}</dd>
          </div>
        )}
      </dl>
      {dossier.historicSignificance && (
        <div className="mt-4">
          <p className="text-kicker mb-1">Historic significance</p>
          <p className="text-[var(--text-primary)] leading-relaxed">{dossier.historicSignificance}</p>
        </div>
      )}
      {(dossier.notableSpeakers?.length ?? 0) > 0 && (
        <div className="mt-4">
          <p className="text-kicker mb-2">Notable speakers (source-backed)</p>
          <ul className="text-sm space-y-2">
            {dossier.notableSpeakers!.map((s) => (
              <li key={`${s.name}-${s.year}`} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{s.name}</span>
                {s.year && <span className="chip chip-muted text-xs">{s.year}</span>}
                {s.role && <span className="text-muted text-xs">{s.role}</span>}
                {s.source_url && (
                  <a href={s.source_url} target="_blank" rel="noreferrer" className="link-inline text-xs inline-flex items-center gap-1">
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2 items-center text-xs">
        <span className="chip chip-muted">Confidence: {dossier.confidenceScore ?? "—"}%</span>
        {dossier.lastRefreshed && (
          <span className="text-muted">Last refreshed {dossier.lastRefreshed.slice(0, 10)}</span>
        )}
      </div>
      {(dossier.sourceLinks?.length ?? 0) > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {dossier.sourceLinks!.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-ark-rust hover:underline inline-flex items-center gap-1">
                {s.label} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {dossier.ticketUrl && (
        <a href={dossier.ticketUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm mt-4 inline-flex">
          Tickets / registration
        </a>
      )}
    </section>
  );
}
