import { useEffect, useMemo, useState } from "react";
import { fetchIngestionCandidates, candidateAdminAction } from "../../lib/api-ingestion";
import type { IngestionCandidate, IntelligenceSection } from "../../lib/intelligence/types";
import { LayerBadge, DensityBadge } from "../intelligence/LayerBadge";
import { CandidateAiPanel } from "./CandidateAiPanel";

const SECTIONS: { id: IntelligenceSection; label: string }[] = [
  { id: "newly_discovered", label: "Newly discovered" },
  { id: "needs_review", label: "Needs review" },
  { id: "high_civic_value", label: "High civic value" },
  { id: "missing_date", label: "Missing date" },
  { id: "missing_location", label: "Missing location" },
  { id: "possible_duplicates", label: "Possible duplicates" },
  { id: "flagship_annual", label: "Flagship annual" },
  { id: "government_meetings", label: "Government meetings" },
  { id: "church_fundraisers", label: "Church fundraisers" },
];

interface Props {
  token: string;
}

type ExtraFilter =
  | "all"
  | "top200_batch"
  | "high_po"
  | "high_rd"
  | "through_november"
  | "church_community"
  | "gov_meetings"
  | "festivals_fairs"
  | "school_sports"
  | "needs_source"
  | "possible_dup";

export function AdminIntelligencePanel({ token }: Props) {
  const [section, setSection] = useState<IntelligenceSection>("newly_discovered");
  const [candidates, setCandidates] = useState<IngestionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [extraFilter, setExtraFilter] = useState<ExtraFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

  async function load(s: IntelligenceSection = section) {
    setLoading(true);
    try {
      setCandidates(await fetchIngestionCandidates(s));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(section);
  }, [section]);

  const filtered = useMemo(() => {
    let list = candidates;
    if (cityFilter) list = list.filter((c) => (c.city || "").toLowerCase().includes(cityFilter.toLowerCase()));
    if (countyFilter) list = list.filter((c) => (c.county || "").toLowerCase().includes(countyFilter.toLowerCase()));
    if (sourceTypeFilter) list = list.filter((c) => (c.sourceType || "").toLowerCase().includes(sourceTypeFilter.toLowerCase()));
    switch (extraFilter) {
      case "top200_batch":
        list = list.filter((c) => (c.harvestBatch || c.discoveredBy || "").includes("top200"));
        break;
      case "high_po":
        list = list.filter((c) => (c.politicalOpportunityScore ?? 0) >= 75);
        break;
      case "high_rd":
        list = list.filter((c) => (c.relationshipDensityScore ?? 0) >= 80);
        break;
      case "through_november":
        list = list.filter((c) => !c.eventDate || c.eventDate <= "2026-11-01");
        break;
      case "church_community":
        list = list.filter((c) => c.intelligenceLayer === "community_church");
        break;
      case "gov_meetings":
        list = list.filter((c) => c.intelligenceLayer === "government" || c.category === "civic_meeting");
        break;
      case "festivals_fairs":
        list = list.filter((c) => c.intelligenceLayer === "community_identity");
        break;
      case "school_sports":
        list = list.filter((c) => c.intelligenceLayer === "school_ecosystem");
        break;
      case "needs_source":
        list = list.filter((c) => !c.sourceUrl || (c.confidenceScore ?? 0) < 50);
        break;
      case "possible_dup":
        list = list.filter((c) => c.reviewStatus === "duplicate" || (c.notes || "").toLowerCase().includes("duplicate"));
        break;
    }
    return list;
  }, [candidates, cityFilter, countyFilter, sourceTypeFilter, extraFilter]);

  const cities = useMemo(() => [...new Set(candidates.map((c) => c.city).filter(Boolean))].sort(), [candidates]);
  const counties = useMemo(() => [...new Set(candidates.map((c) => c.county).filter(Boolean))].sort(), [candidates]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function batchAction(action: "approve_to_events" | "reject" | "mark_duplicate") {
    if (!selected.size) return;
    setBatchBusy(true);
    for (const id of selected) {
      try {
        await candidateAdminAction(token, id, action);
      } catch (_) {}
    }
    setSelected(new Set());
    setBatchBusy(false);
    load(section);
  }

  return (
    <div>
      <p className="text-sm text-ark-pine/75 mb-4">
        Public-source discoveries only — AI is advisory, never auto-published. Approve moves to live events table.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={section === s.id ? "chip chip-active" : "chip chip-muted"}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card mb-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ark-pine/70">Filters</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="input text-sm" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
          <select className="input text-sm" value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)}>
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
          <input
            className="input text-sm"
            placeholder="Source type"
            value={sourceTypeFilter}
            onChange={(e) => setSourceTypeFilter(e.target.value)}
          />
          <select className="input text-sm" value={extraFilter} onChange={(e) => setExtraFilter(e.target.value as ExtraFilter)}>
            <option value="all">All batches</option>
            <option value="top200_batch">Harvest batch (top 200)</option>
            <option value="through_november">Date through Nov 2026</option>
            <option value="high_po">High PO (75+)</option>
            <option value="high_rd">High RD (80+)</option>
            <option value="church_community">Church / community</option>
            <option value="gov_meetings">Government meetings</option>
            <option value="festivals_fairs">Festivals / fairs</option>
            <option value="school_sports">School / sports</option>
            <option value="needs_source">Needs source verification</option>
            <option value="possible_dup">Possible duplicate</option>
          </select>
        </div>
        <p className="text-xs text-ark-pine/60">{filtered.length} of {candidates.length} candidates shown</p>
      </div>

      {selected.size > 0 && (
        <div className="card mb-4 flex flex-wrap gap-2 items-center bg-ark-wheat/60">
          <span className="text-sm font-medium text-ark-pine">{selected.size} selected</span>
          <button type="button" disabled={batchBusy} className="btn-primary text-xs py-2" onClick={() => batchAction("approve_to_events")}>
            Approve selected
          </button>
          <button type="button" disabled={batchBusy} className="btn-secondary text-xs py-2" onClick={() => batchAction("reject")}>
            Reject selected
          </button>
          <button type="button" disabled={batchBusy} className="btn-secondary text-xs py-2" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-ark-pine/70">Loading intelligence…</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c.id} className="card card-elevated border-l-4 border-l-ark-rust/60">
              <div className="flex gap-3 items-start">
                <input
                  type="checkbox"
                  className="mt-1.5 h-4 w-4 rounded border-ark-pine/30"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between gap-2 items-start">
                    <h3 className="font-semibold text-ark-pine">{c.title}</h3>
                    <div className="flex flex-wrap gap-1">
                      {c.intelligenceLayer && <LayerBadge layer={c.intelligenceLayer} compact />}
                      {c.politicalOpportunityScore != null && (
                        <span className="chip chip-score">PO {c.politicalOpportunityScore}</span>
                      )}
                      {c.relationshipDensityScore != null && <DensityBadge score={c.relationshipDensityScore} />}
                      {c.harvestBatch && <span className="chip chip-muted">{c.harvestBatch}</span>}
                    </div>
                  </div>
                  <p className="text-sm text-ark-pine/75 mt-1">
                    {[c.city, c.county ? `${c.county} County` : null, c.eventDate || "date TBD"].filter(Boolean).join(" · ")}
                  </p>
                  {c.notes && <p className="text-sm text-ark-pine/80 mt-2">{c.notes}</p>}
                  {c.sourceUrl && (
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-ark-rust font-medium hover:underline mt-1 inline-block">
                      Source: {c.sourceName || c.sourceUrl}
                    </a>
                  )}
                  <CandidateAiPanel token={token} candidate={c} onAction={() => load(section)} />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-ark-pine/70">No candidates match current filters.</p>}
        </div>
      )}
    </div>
  );
}
