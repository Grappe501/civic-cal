import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, MapPin, Target } from "lucide-react";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import type { CountyIntelligenceDossier, LocalIntelligenceSummary } from "../../lib/local-intelligence/types";
import { citiesInCounty, citySlug, voteTargetGap } from "../../lib/local-intelligence/registry";
import { notesForCounty, saveCampaignNote } from "../../lib/local-intelligence/campaignNotesStore";
import { summarizeLocalIntelligence } from "../../lib/api-local-intelligence";
import { fetchEvents } from "../../lib/api";
import { scoreEventForCampaign } from "../../lib/campaigns/eventIntel";
import type { CivicEvent } from "../../lib/types";

interface Props {
  workspace: CampaignWorkspace;
  county: CountyIntelligenceDossier;
}

export function CountyIntelligenceBrief({ workspace, county }: Props) {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [summary, setSummary] = useState<LocalIntelligenceSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [notes, setNotes] = useState(() => notesForCounty(workspace.slug, county.county));
  const towns = citiesInCounty(county.county);
  const gap = voteTargetGap(county);
  const theme = workspace.dashboardTheme;

  useEffect(() => {
    fetchEvents({ county: county.county, limit: 100 }).then(setEvents).catch(() => setEvents([]));
  }, [county.county]);

  const countyEvents = useMemo(
    () => events.filter((e) => e.county?.toLowerCase() === county.county.toLowerCase()),
    [events, county.county],
  );

  const topRd = useMemo(
    () =>
      [...countyEvents]
        .map((e) => ({ event: e, scored: scoreEventForCampaign(e) }))
        .sort((a, b) => b.scored.relationshipDensityScore - a.scored.relationshipDensityScore)
        .slice(0, 6),
    [countyEvents],
  );

  const gov = countyEvents.filter((e) => e.category === "civic_meeting" || e.isPublicGovernmentMeeting).slice(0, 5);
  const church = countyEvents.filter((e) => e.category === "community_church" || e.category === "faith_meal").slice(0, 5);

  async function askAi() {
    setAiLoading(true);
    try {
      setSummary(await summarizeLocalIntelligence({ workspace, countyDossier: county, events: countyEvents }));
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="intel-brief">
      <div className="intel-hero" style={{ borderTopColor: theme.primaryColor }}>
        <p className="section-kicker">Candidate-only · not public</p>
        <h1 className="page-header">{county.county} County</h1>
        <p className="text-muted">{county.region} · Seat: {county.countySeat || "Verify"}</p>
        <span className="chip chip-muted text-[10px] mt-2">Confidence {county.confidenceScore}%</span>
      </div>

      <div className="intel-exec-summary card card-elevated mt-6" style={{ backgroundColor: theme.surfaceColor }}>
        <h2 className="font-display font-semibold" style={{ color: theme.primaryColor }}>County profile</h2>
        <p className="text-sm text-ark-pine/85 mt-2">{county.demographicsSummary}</p>
        {county.winPathNotes && <p className="text-sm mt-2">{county.winPathNotes}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card card-elevated">
            <h2 className="intel-section-title"><MapPin className="h-5 w-5" /> Cities & towns</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {towns.slice(0, 12).map((t) => (
                <Link key={t.city} to={`/campaigns/${workspace.slug}/city/${citySlug(t.city)}`} className="chip chip-muted hover:border-ark-rust/40">
                  {t.city}
                </Link>
              ))}
              {(county.majorTowns ?? []).filter((t) => !towns.find((x) => x.city === t)).map((t) => (
                <span key={t} className="chip chip-muted opacity-60">{t}</span>
              ))}
            </div>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title">Upcoming events ({countyEvents.length})</h2>
            <div className="mt-3 space-y-2">
              {countyEvents.slice(0, 8).map((e) => (
                <Link key={e.id} to={`/event/${e.slug}`} className="block text-sm font-medium text-ark-pine hover:text-ark-rust">
                  {e.title} · {e.city}
                </Link>
              ))}
              {countyEvents.length === 0 && <p className="text-sm intel-data-unknown">Field coverage gap — no events indexed</p>}
            </div>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title">Highest RD rooms</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {topRd.map(({ event, scored }) => (
                <li key={event.id}>
                  <Link to={`/event/${event.slug}`} className="font-medium hover:underline">{event.title}</Link>
                  <span className="text-muted text-xs block">RD {scored.relationshipDensityScore} · {event.city}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid sm:grid-cols-2 gap-4">
            <section className="card">
              <h3 className="font-semibold text-sm">Government meetings</h3>
              <ul className="mt-2 text-xs space-y-1">{gov.map((e) => <li key={e.id}>{e.title}</li>)}</ul>
            </section>
            <section className="card">
              <h3 className="font-semibold text-sm">Church / community</h3>
              <ul className="mt-2 text-xs space-y-1">{church.map((e) => <li key={e.id}>{e.title}</li>)}</ul>
            </section>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="card card-elevated intel-election-panel" style={{ borderLeft: `4px solid ${theme.accentColor}` }}>
            <h2 className="intel-section-title"><Target className="h-5 w-5" /> Election targets</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Prior SOS baseline</dt><dd>{county.priorSosBaseline?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Target votes</dt><dd>{county.targetVotes?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Gap</dt><dd className="font-semibold">{gap?.toLocaleString() ?? "—"}</dd></div>
            </dl>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title text-sm">Campaign notes</h2>
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
              <textarea name="note" rows={2} className="input text-xs" />
              <button type="submit" className="btn-secondary text-xs py-1.5 mt-1 w-full">Add note</button>
            </form>
          </section>

          <button type="button" disabled={aiLoading} className="btn-primary w-full text-sm" onClick={askAi}>
            <Brain className="h-4 w-4" /> {aiLoading ? "…" : "Ask AI about this county"}
          </button>
          {summary && <p className="text-xs text-muted">{summary.whyItMatters}</p>}
        </aside>
      </div>
    </div>
  );
}
