import { useEffect, useMemo, useState } from "react";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import type { CountyIntelligenceDossier, LocalIntelligenceSummary } from "../../lib/local-intelligence/types";
import { buildCountyRollupView } from "../../lib/local-intelligence/countyRollup";
import { loadPlansForCampaign } from "../../lib/campaigns/planStore";
import { analyzeCountyOpportunity } from "../../lib/ai/countyOpportunityAnalysis";
import { summarizeLocalIntelligence } from "../../lib/api-local-intelligence";
import { fetchEvents } from "../../lib/api";
import type { CivicEvent } from "../../lib/types";
import { CountyRollupBrief } from "./CountyRollupBrief";
import { notesForCounty, saveCampaignNote } from "../../lib/local-intelligence/campaignNotesStore";

interface Props {
  workspace: CampaignWorkspace;
  county: CountyIntelligenceDossier;
}

export function CountyIntelligenceBrief({ workspace, county }: Props) {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [summary, setSummary] = useState<LocalIntelligenceSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [notes, setNotes] = useState(() => notesForCounty(workspace.slug, county.county));
  const plans = useMemo(() => loadPlansForCampaign(workspace.slug), [workspace.slug]);

  useEffect(() => {
    fetchEvents({ county: county.county, limit: 150 }).then(setEvents).catch(() => setEvents([]));
  }, [county.county]);

  const countyEvents = useMemo(
    () => events.filter((e) => e.county?.toLowerCase() === county.county.toLowerCase()),
    [events, county.county],
  );

  const rollup = useMemo(
    () => buildCountyRollupView(county, countyEvents, plans),
    [county, countyEvents, plans],
  );

  const opportunity = useMemo(
    () => analyzeCountyOpportunity(rollup, workspace, countyEvents, plans),
    [rollup, workspace, countyEvents, plans],
  );

  async function generateBrief() {
    setAiLoading(true);
    try {
      const s = await summarizeLocalIntelligence({
        workspace,
        countyDossier: rollup.dossier,
        events: countyEvents,
      });
      setSummary({ ...s, opportunity });
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <CountyRollupBrief
        workspace={workspace}
        rollup={rollup}
        events={countyEvents}
        summary={summary}
        opportunity={opportunity}
        onGenerateBrief={generateBrief}
        aiLoading={aiLoading}
      />
      <section className="card card-elevated mt-6 max-w-md">
        <h3 className="font-semibold text-sm">Campaign notes</h3>
        <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
          {notes.map((n) => <li key={n.id} className="text-xs bg-ark-wheat/50 px-2 py-1 rounded">{n.noteText}</li>)}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = new FormData(e.currentTarget).get("note") as string;
            if (text.trim()) {
              saveCampaignNote(workspace.slug, { county: county.county, noteType: "field_note", noteText: text.trim(), visibility: "private" });
              setNotes(notesForCounty(workspace.slug, county.county));
              e.currentTarget.reset();
            }
          }}
          className="mt-2"
        >
          <textarea name="note" rows={2} className="input text-xs" placeholder="Private county field note…" />
          <button type="submit" className="btn-secondary text-xs py-1.5 mt-1 w-full">Add note</button>
        </form>
      </section>
    </>
  );
}
