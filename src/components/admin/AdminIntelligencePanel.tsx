import { useEffect, useState } from "react";
import { candidateAdminAction, fetchIngestionCandidates } from "../../lib/api-ingestion";
import type { IngestionCandidate, IntelligenceSection } from "../../lib/intelligence/types";
import { LayerBadge, DensityBadge } from "../intelligence/LayerBadge";

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

export function AdminIntelligencePanel({ token }: Props) {
  const [section, setSection] = useState<IntelligenceSection>("newly_discovered");
  const [candidates, setCandidates] = useState<IngestionCandidate[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function act(id: string, action: "approve_to_events" | "reject" | "mark_duplicate" | "mark_recurring") {
    try {
      await candidateAdminAction(token, id, action);
    } catch {
      /* demo mode — remove from UI locally */
    }
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <p className="text-sm text-ark-pine/60 mb-4">
        Public-source discoveries only — never auto-published. Approve moves to live events table.
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={section === s.id ? "chip bg-ark-rust text-white" : "chip bg-ark-wheat text-ark-pine"}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ark-pine/60">Loading intelligence…</p>
      ) : (
        <div className="space-y-4">
          {candidates.map((c) => (
            <div key={c.id} className="card border-l-4 border-l-ark-rust/50">
              <div className="flex flex-wrap justify-between gap-2 items-start">
                <h3 className="font-semibold text-ark-pine">{c.title}</h3>
                <div className="flex flex-wrap gap-1">
                  {c.intelligenceLayer && <LayerBadge layer={c.intelligenceLayer} compact />}
                  {c.politicalOpportunityScore != null && (
                    <span className="chip bg-ark-pine/10 text-ark-pine text-xs">PO {c.politicalOpportunityScore}</span>
                  )}
                  {c.relationshipDensityScore != null && <DensityBadge score={c.relationshipDensityScore} />}
                </div>
              </div>
              <p className="text-sm text-ark-pine/60 mt-1">
                {[c.city, c.county ? `${c.county} County` : null, c.eventDate || "date TBD"].filter(Boolean).join(" · ")}
              </p>
              {c.notes && <p className="text-sm text-ark-pine/70 mt-2">{c.notes}</p>}
              {c.sourceUrl && (
                <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-ark-rust hover:underline mt-1 inline-block">
                  Source: {c.sourceName || c.sourceUrl}
                </a>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-primary text-xs py-2" onClick={() => act(c.id, "approve_to_events")}>
                  Approve into events
                </button>
                <button type="button" className="btn-secondary text-xs py-2" onClick={() => act(c.id, "reject")}>
                  Reject
                </button>
                <button type="button" className="btn-secondary text-xs py-2" onClick={() => act(c.id, "mark_duplicate")}>
                  Mark duplicate
                </button>
                <button type="button" className="btn-secondary text-xs py-2" onClick={() => act(c.id, "mark_recurring")}>
                  Recurring annual
                </button>
              </div>
            </div>
          ))}
          {candidates.length === 0 && <p className="text-ark-pine/60">No candidates in this section.</p>}
        </div>
      )}
    </div>
  );
}
