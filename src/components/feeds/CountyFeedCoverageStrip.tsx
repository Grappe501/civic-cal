import type { CountyFeedCoverage } from "../../lib/feeds/types";
import { formatFeedAttachmentScore } from "../../lib/ai/feedDiscoveryAssistant";

interface Props {
  coverage: CountyFeedCoverage | null;
}

export function CountyFeedCoverageStrip({ coverage }: Props) {
  if (!coverage) return null;

  return (
    <section className="card-readable text-sm mb-6">
      <p className="text-kicker">Feed attachment score</p>
      <p className="text-xs text-muted mt-1">{formatFeedAttachmentScore(coverage)}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <Metric label="Institutions" value={String(coverage.institutions)} />
        <Metric label="Feeds attached" value={String(coverage.feedsAttached)} highlight />
        <Metric label="Feeds missing" value={String(coverage.feedsMissing)} />
        <Metric label="Coverage" value={`${coverage.coveragePercent}%`} highlight />
      </div>
      <p className="text-xs text-muted mt-2">
        Potential yield: {coverage.potentialProjectedYield.toLocaleString()} events/year if feeds attach · Verified on calendar:{" "}
        {coverage.verifiedEvents}
      </p>
    </section>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-lg bg-ark-pine/5 border border-ark-sage px-3 py-2" : ""}>
      <p className="text-[10px] uppercase font-bold text-muted">{label}</p>
      <p className="text-xl font-bold text-ark-pine">{value}</p>
    </div>
  );
}
