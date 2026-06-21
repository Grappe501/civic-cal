import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Link2, Target } from "lucide-react";
import { loadFeedAttachmentReport } from "../lib/feeds/feedAttachmentReport";
import { countySlugify } from "../lib/profiles/profileLinks";

export function AdminFeedCoveragePage() {
  const report = useMemo(() => loadFeedAttachmentReport(), []);
  const m = report.metrics;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Pass 23A — Feed Attachment Engine</p>
          <h1 className="page-header text-2xl">Institution → feed → event stream</h1>
          <p className="text-muted text-sm mt-1">
            Feeds are the asset. Events are the output. Track attachment before harvest depth.
          </p>
        </div>
        <Link to="/admin/density" className="btn-ghost text-sm">Density engine →</Link>
      </div>

      <section className="card-readable grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
        <Stat label="Known institutions" value={String(m.knownInstitutions)} highlight />
        <Stat label="Feed slots" value={String(m.feedSlotsTotal)} />
        <Stat label="Feeds attached" value={String(m.feedsAttached)} highlight />
        <Stat label="Coverage" value={`${m.coveragePercent}%`} highlight />
        <Stat label="Feeds missing" value={String(m.feedsMissing)} />
        <Stat label="Verified events (seed)" value={String(m.verifiedEventCount)} />
        <Stat label="Attached projected yield" value={String(m.attachedProjectedYield)} />
        <Stat label="Potential projected yield" value={String(Math.round(m.potentialProjectedYield))} highlight />
        <Stat label="Staged party meetings" value={String(m.stagedPartyMeetings)} />
        <Stat label="Density engine projected" value={String(m.densityEngineProjected)} />
        <Stat label="Density goal" value={String(m.densityEngineGoal)} />
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" /> Lowest feed coverage counties
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
                <th className="py-2 pr-4">Verified events</th>
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
                  <td className="py-2 pr-4">{c.verifiedEvents}</td>
                  <td className="py-2">{c.potentialProjectedYield.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Tier 1 gaps (attach next)
        </h2>
        <ul className="mt-3 space-y-2 text-sm max-h-96 overflow-y-auto">
          {report.tier1Gaps.map((g) => (
            <li key={g.id} className="border border-ark-sage/20 rounded-lg px-3 py-2">
              <span className="font-medium">{g.label}</span>
              <span className="badge-warning text-[10px] ml-2">{g.attachment_status}</span>
              <p className="text-xs text-muted mt-1">Expected yield: {g.expected_yield} · {g.source_type}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-readable text-sm">
        <h2 className="font-semibold mb-2">Commands</h2>
        <pre className="text-xs bg-ark-porch rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
{`npm run feeds:generate    # county + city feed slot registries
npm run feeds:report      # attachment coverage dashboard JSON
npm run discover:sources  # refresh city source templates
npm run harvest:top200    # harvest attached feeds (needs search API key)`}
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
