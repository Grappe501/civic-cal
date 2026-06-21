import { useEffect, useMemo, useState } from "react";
import { fetchIngestionCandidates, candidateAdminAction, approveRecurringSeriesAction } from "../../lib/api-ingestion";
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
  { id: "public_party_meetings", label: "Public party meetings" },
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
  | "possible_dup"
  | "county_fairs"
  | "historic_political"
  | "party_all"
  | "party_democratic"
  | "party_republican"
  | "party_libertarian"
  | "party_recurrence_review"
  | "party_missing_venue"
  | "party_missing_date";

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
  const [seriesBusy, setSeriesBusy] = useState<string | null>(null);

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
        list = list.filter(
          (c) =>
            c.intelligenceLayer === "community_identity" ||
            c.discoveredBy === "fair_festival_harvest" ||
            (c.harvestBatch || "").includes("fair_festival") ||
            /festival|fair\b|rodeo|watermelon|peach|tomato|grape|crawdad|gumbo|folklife|scotsfest|toad suck/i.test(c.title),
        );
        break;
      case "county_fairs":
        list = list.filter(
          (c) =>
            c.discoveredBy === "county_fair_harvest" ||
            (c.harvestBatch || "").includes("county_fair") ||
            /county fair/i.test(c.title),
        );
        break;
      case "historic_political":
        list = list.filter(
          (c) =>
            c.discoveredBy === "historic_political_harvest" ||
            (c.harvestBatch || "").includes("historic_political") ||
            /shackelford|clinton day|reagan rockefeller|lincoln day|black caucus|candidate forum|political dinner/i.test(c.title),
        );
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
      case "party_all":
        list = list.filter((c) => c.category === "public_party_meeting");
        break;
      case "party_democratic":
        list = list.filter((c) => c.category === "public_party_meeting" && c.partyLabel === "Democratic");
        break;
      case "party_republican":
        list = list.filter((c) => c.category === "public_party_meeting" && c.partyLabel === "Republican");
        break;
      case "party_libertarian":
        list = list.filter((c) => c.category === "public_party_meeting" && c.partyLabel === "Libertarian");
        break;
      case "party_recurrence_review":
        list = list.filter(
          (c) =>
            c.category === "public_party_meeting" &&
            ((c.notes || "").includes("Recurrence unclear") || c.reviewStatus === "needs_verification"),
        );
        break;
      case "party_missing_venue":
        list = list.filter((c) => c.category === "public_party_meeting" && !c.venueName && !c.address);
        break;
      case "party_missing_date":
        list = list.filter((c) => c.category === "public_party_meeting" && !c.eventDate);
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

  const seriesGroups = useMemo(() => {
    const map = new Map<string, IngestionCandidate[]>();
    for (const c of filtered) {
      if (c.category !== "public_party_meeting" || !c.seriesKey) continue;
      const list = map.get(c.seriesKey) ?? [];
      list.push(c);
      map.set(c.seriesKey, list);
    }
    return [...map.entries()]
      .filter(([, list]) => list.length > 1 && list.some((c) => c.isRecurringSeries))
      .sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  async function approveSeries(seriesKey: string) {
    setSeriesBusy(seriesKey);
    try {
      await approveRecurringSeriesAction(token, seriesKey);
      await load(section);
    } finally {
      setSeriesBusy(null);
    }
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
      <p className="text-sm text-muted mb-4">
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Filters</p>
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
            <option value="festivals_fairs">Fairs &amp; Festivals</option>
            <option value="county_fairs">County fairs</option>
            <option value="historic_political">Historic political events</option>
            <option value="school_sports">School / sports</option>
            <option value="needs_source">Needs source verification</option>
            <option value="possible_dup">Possible duplicate</option>
            <option value="party_all">Public party meetings</option>
            <option value="party_democratic">Democratic county meetings</option>
            <option value="party_republican">Republican county meetings</option>
            <option value="party_libertarian">Libertarian meetings</option>
            <option value="party_recurrence_review">Needs recurrence review</option>
            <option value="party_missing_venue">Missing venue</option>
            <option value="party_missing_date">Missing next date</option>
          </select>
        </div>
        <p className="text-xs text-muted-soft">{filtered.length} of {candidates.length} candidates shown</p>
      </div>

      {seriesGroups.length > 0 && extraFilter.startsWith("party") && (
        <div className="card mb-4 bg-ark-pine/5 border border-ark-sage">
          <p className="text-sm font-semibold text-ark-pine mb-2">Verified recurring series — approve all occurrences at once</p>
          <ul className="space-y-2 text-sm">
            {seriesGroups.slice(0, 12).map(([key, list]) => (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 border-b border-ark-sage/20 pb-2">
                <span>
                  {list[0]?.title?.replace(/ Meeting.*/, " Meeting")} · {list.length} occurrences · {list[0]?.partyLabel}
                </span>
                <button
                  type="button"
                  className="btn-primary text-xs py-1.5"
                  disabled={!!seriesBusy}
                  onClick={() => approveSeries(key)}
                >
                  {seriesBusy === key ? "Approving…" : "Approve entire series"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        <p className="text-muted">Loading intelligence…</p>
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
                  <p className="text-sm text-muted mt-1">
                    {[c.city, c.county ? `${c.county} County` : null, c.eventDate || "date TBD"].filter(Boolean).join(" · ")}
                  </p>
                  {c.notes && <p className="text-sm text-muted mt-2">{c.notes}</p>}
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
          {filtered.length === 0 && <p className="text-muted">No candidates match current filters.</p>}
        </div>
      )}
    </div>
  );
}
