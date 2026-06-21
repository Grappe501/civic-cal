import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Link2, Radar, Target } from "lucide-react";
import { loadFeedAttachmentReport } from "../lib/feeds/feedAttachmentReport";
import { buildCountyFeedDiscoveryPlan } from "../lib/ai/feedDiscoveryAssistant";
import { countySlugify } from "../lib/profiles/profileLinks";

export function AdminFeedCoveragePage() {
  const report = useMemo(() => loadFeedAttachmentReport(), []);
  const m = report.metrics;
  const whitePlan = useMemo(() => buildCountyFeedDiscoveryPlan("White", report), [report]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Pass 23A + 23C — Feed Attachment & Discovery</p>
          <h1 className="page-header text-2xl">Institution → feed → event stream</h1>
          <p className="text-muted text-sm mt-1">
            Statewide goal: <strong>{m.attachmentGoal ?? 1500} feed attachments</strong> — feeds are the asset, events are the output.
          </p>
        </div>
        <Link to="/admin/density" className="btn-ghost text-sm">Density engine →</Link>
      </div>

      <section className="card-readable mb-8 border-l-4 border-l-ark-rust">
        <h2 className="font-semibold text-lg">Attachment goal progress</h2>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-4xl font-bold text-ark-pine">{m.feedsAttached}</p>
            <p className="text-xs text-muted">feeds attached (verified URLs)</p>
          </div>
          <div className="text-muted text-2xl">→</div>
          <div>
            <p className="text-4xl font-bold text-ark-rust">{m.attachmentGoal ?? 1500}</p>
            <p className="text-xs text-muted">goal · {m.feedsToGoal ?? 0} to go ({m.attachmentGoalProgress ?? 0}%)</p>
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-ark-sage/20 overflow-hidden">
          <div
            className="h-full bg-ark-rust rounded-full transition-all"
            style={{ width: `${Math.min(100, m.attachmentGoalProgress ?? 0)}%` }}
          />
        </div>
      </section>

      <section className="card-readable grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
        <Stat label="Known institutions" value={String(m.knownInstitutions)} highlight />
        <Stat label="Slot feeds" value={String(m.feedSlotsTotal)} />
        <Stat label="Institution feeds" value={String(m.institutionFeedsTotal ?? 0)} />
        <Stat label="Slot coverage" value={`${m.coveragePercent}%`} />
        <Stat label="Feeds missing (slots)" value={String(m.feedsMissing)} />
        <Stat label="Verified events (seed)" value={String(m.verifiedEventCount)} />
        <Stat label="Attached annual yield" value={String(m.attachedProjectedYield)} highlight />
        <Stat label="Potential annual yield" value={String(Math.round(m.potentialProjectedYield))} />
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold flex items-center gap-2">
          <Radar className="h-4 w-4" /> Feed discovery assistant (example: White County)
        </h2>
        <p className="text-xs text-muted mt-1">Advisory only — recommends searches, never invents events.</p>
        <ul className="mt-3 text-sm space-y-1">
          {whitePlan.highestProbabilityFeeds.map((f) => (
            <li key={f}>· {f}</li>
          ))}
        </ul>
        <p className="text-sm mt-3 font-medium">Expected annual yield if attached: ~{whitePlan.expectedAnnualYield} events</p>
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" /> Feed attachment score — lowest counties
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase text-muted border-b">
                <th className="py-2 pr-4">County</th>
                <th className="py-2 pr-4">Institutions</th>
                <th className="py-2 pr-4">Attached</th>
                <th className="py-2 pr-4">Missing</th>
                <th className="py-2 pr-4">Coverage</th>
                <th className="py-2">Potential yield</th>
              </tr>
            </thead>
            <tbody>
              {report.bottomCounties.map((c) => (
                <tr key={c.county} className="border-b border-ark-sage/20">
                  <td className="py-2 pr-4">
                    <Link to={`/${countySlugify(c.county)}-county`} className="text-ark-rust hover:underline font-medium">
                      {c.county}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{c.institutions}</td>
                  <td className="py-2 pr-4">{c.feedsAttached}</td>
                  <td className="py-2 pr-4">{c.feedsMissing}</td>
                  <td className="py-2 pr-4 font-bold">{c.coveragePercent}%</td>
                  <td className="py-2">{c.potentialProjectedYield.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Tier 1 gaps (discover next)
        </h2>
        <ul className="mt-3 space-y-2 text-sm max-h-96 overflow-y-auto">
          {report.tier1Gaps.map((g) => (
            <li key={g.id} className="border border-ark-sage/20 rounded-lg px-3 py-2">
              <span className="font-medium">{g.label}</span>
              <span className="badge-warning text-[10px] ml-2">{g.attachment_status}</span>
              <p className="text-xs text-muted mt-1">Expected yield: {g.expected_yield}/yr · {g.source_type}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-readable text-sm">
        <h2 className="font-semibold mb-2">Commands</h2>
        <pre className="text-xs bg-ark-porch rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
{`npm run feeds:discover     # verify candidate URLs (Pass 23C)
npm run feeds:apply        # merge discoveries into registries
npm run feeds:discover-all # discover + apply + report
npm run feeds:report       # refresh attachment dashboard`}
        </pre>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-lg bg-ark-pine/5 border border-ark-sage px-3 py-2" : ""}>
      <p className="text-xs uppercase font-bold text-muted">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
