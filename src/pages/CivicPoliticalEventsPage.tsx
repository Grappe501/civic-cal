import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { History, Search } from "lucide-react";
import { PageMeta } from "../components/seo/PageMeta";
import { listCivicPoliticalDirectoryEntries } from "../lib/political-events/historicPoliticalEvents";

const TYPE_LABELS: Record<string, string> = {
  annual_party_dinner: "Annual dinner",
  county_party_dinner: "County party dinner",
  caucus_event: "Caucus event",
  candidate_forum: "Candidate forum",
  political_fundraiser: "Fundraiser",
  youth_party_event: "Youth party event",
  state_committee: "State committee / convention",
};

export function CivicPoliticalEventsPage() {
  const [query, setQuery] = useState("");
  const entries = useMemo(() => listCivicPoliticalDirectoryEntries(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.city ?? "").toLowerCase().includes(q) ||
        (e.county ?? "").toLowerCase().includes(q) ||
        e.eventType.includes(q),
    );
  }, [entries, query]);

  const approvedCount = entries.filter((e) => e.isApproved).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageMeta
        title="Arkansas civic-political events"
        description="Source-backed recurring political dinners, forums, and county party events — neutral civic calendar intelligence."
        canonicalPath="/civic-political-events"
      />
      <p className="section-kicker">Pass 30 — Historic political intelligence</p>
      <h1 className="page-header">Civic-political events</h1>
      <p className="text-muted mt-2 max-w-2xl">
        Major recurring dinners, forums, and fundraisers where Arkansas candidates and community leaders historically gather.
        Neutral labeling only — no endorsements. Published dates require verified public sources.
      </p>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <span className="chip chip-muted">{entries.length} indexed traditions</span>
        <span className="chip chip-active">{approvedCount} on public calendar</span>
        <span className="chip chip-muted">{entries.filter((e) => e.historyAvailable).length} with history dossiers</span>
      </div>

      <label className="relative block mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden />
        <input
          type="search"
          className="input-readable pl-9 w-full"
          placeholder="Search dinners, forums, counties…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <li key={e.id}>
            {e.approvedSlug ? (
              <Link to={`/event/${e.approvedSlug}`} className="card block hover:border-ark-sage h-full py-3">
                <EventCardInner entry={e} />
              </Link>
            ) : (
              <div className="card py-3 h-full opacity-90">
                <EventCardInner entry={e} staged />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventCardInner({
  entry,
  staged,
}: {
  entry: ReturnType<typeof listCivicPoliticalDirectoryEntries>[number];
  staged?: boolean;
}) {
  return (
    <>
      <p className="font-medium text-sm">{entry.title}</p>
      <p className="text-[10px] text-muted mt-1">
        {TYPE_LABELS[entry.eventType] ?? entry.eventType}
        {entry.city ? ` · ${entry.city}` : ""}
        {entry.county ? ` · ${entry.county} County` : ""}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {entry.isApproved && <span className="badge-success text-[10px]">On calendar</span>}
        {staged && <span className="badge-warning text-[10px]">Needs review</span>}
        {entry.historyAvailable && (
          <span className="chip chip-muted text-[10px] inline-flex items-center gap-1">
            <History className="h-3 w-3" /> History
          </span>
        )}
        <span className="chip chip-muted text-[10px]">{entry.confidenceScore}% confidence</span>
      </div>
      {entry.nextVerifiedDate && (
        <p className="text-xs text-ark-pine mt-2 font-medium">Next verified: {entry.nextVerifiedDate}</p>
      )}
    </>
  );
}
