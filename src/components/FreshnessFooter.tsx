import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { FreshnessMeta } from "../lib/freshness/freshnessTypes";
import { staleLabel } from "../lib/freshness/staleData";

interface Props {
  freshness: FreshnessMeta;
  entityLabel?: string;
}

export function FreshnessFooter({ freshness, entityLabel = "this page" }: Props) {
  const refreshed = new Date(freshness.lastRefreshedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <footer className="mt-10 panel-light border-t-4 border-ark-sage/40 text-sm">
      <h2 className="font-semibold text-[var(--text-secondary)]">Source & freshness</h2>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-muted">
        <div>
          <dt className="text-caption font-bold uppercase">Information last refreshed</dt>
          <dd className="font-medium text-[var(--text-primary)]">{refreshed}</dd>
        </div>
        <div>
          <dt className="text-caption font-bold uppercase">Source confidence</dt>
          <dd>
            <span
              className={
                freshness.sourceConfidence === "high"
                  ? "badge-success"
                  : freshness.sourceConfidence === "medium"
                    ? "badge-info"
                    : freshness.sourceConfidence === "low"
                      ? "badge-warning"
                      : "badge-warning"
              }
            >
              {freshness.sourceConfidence}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-caption font-bold uppercase">Sources on file</dt>
          <dd className="font-medium text-[var(--text-primary)]">{freshness.sourceCount}</dd>
        </div>
        <div>
          <dt className="text-caption font-bold uppercase">Verification</dt>
          <dd className="capitalize">{freshness.verificationStatus.replace(/_/g, " ")}</dd>
        </div>
      </dl>

      {(freshness.refreshNeeded || freshness.sourceConfidence === "placeholder") && (
        <p className="mt-3 flex items-start gap-2 text-amber-950 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            {staleLabel(freshness)}. Data for {entityLabel} may be incomplete — confirm with official sources.
            {freshness.refreshNotes && ` ${freshness.refreshNotes}`}
          </span>
        </p>
      )}

      {freshness.sourceLinks.length > 0 && (
        <ul className="mt-3 space-y-1">
          {freshness.sourceLinks.map((s: { url: string; label: string }) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-ark-rust hover:underline font-medium"
              >
                {s.label} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <Link to="/help-build-the-calendar" className="btn-secondary text-xs mt-4 inline-flex">
        Report an update
      </Link>
    </footer>
  );
}
