import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, MapPin, Target, TrendingUp } from "lucide-react";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import type { CityIntelligenceDossier, LocalIntelligenceSummary } from "../../lib/local-intelligence/types";
import { getCountyDossier, voteTargetGap } from "../../lib/local-intelligence/registry";
import { countySlug } from "../../lib/counties";
import { notesForCity, saveCampaignNote } from "../../lib/local-intelligence/campaignNotesStore";
import { summarizeLocalIntelligence } from "../../lib/api-local-intelligence";
import { fetchEvents } from "../../lib/api";
import type { CivicEvent } from "../../lib/types";
import { formatEventRange } from "../../lib/format";

interface Props {
  workspace: CampaignWorkspace;
  city: CityIntelligenceDossier;
}

function ConfidenceBadge({ score }: { score: number }) {
  const label = score >= 60 ? "High" : score >= 35 ? "Partial" : "Low";
  return <span className="chip chip-muted text-[10px]">Source confidence: {label} ({score}%)</span>;
}

function DataCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="intel-data-card">
      <dt className="intel-data-label">{label}</dt>
      <dd className={value ? "intel-data-value" : "intel-data-unknown"}>{value || "Pending verification"}</dd>
    </div>
  );
}

export function CityIntelligenceBrief({ workspace, city }: Props) {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [summary, setSummary] = useState<LocalIntelligenceSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [notes, setNotes] = useState(() => notesForCity(workspace.slug, city.city));
  const countyDossier = getCountyDossier(city.county);
  const gap = voteTargetGap(city);

  useEffect(() => {
    fetchEvents({ city: city.city, limit: 50 }).then(setEvents).catch(() => setEvents([]));
  }, [city.city]);

  const cityEvents = useMemo(
    () => events.filter((e) => e.city?.toLowerCase() === city.city.toLowerCase()),
    [events, city.city],
  );

  async function askAi() {
    setAiLoading(true);
    try {
      setSummary(
        await summarizeLocalIntelligence({
          workspace,
          cityDossier: city,
          countyDossier,
          events: cityEvents,
        }),
      );
    } finally {
      setAiLoading(false);
    }
  }

  function addNote(text: string) {
    if (!text.trim()) return;
    saveCampaignNote(workspace.slug, {
      city: city.city,
      county: city.county,
      noteType: "field_note",
      noteText: text.trim(),
      visibility: "private",
    });
    setNotes(notesForCity(workspace.slug, city.city));
  }

  const theme = workspace.dashboardTheme;

  return (
    <div className="intel-brief">
      <div className="intel-hero" style={{ borderTopColor: theme.primaryColor }}>
        <p className="section-kicker">Candidate-only · not public</p>
        <h1 className="page-header">{city.city}</h1>
        <p className="text-muted">{city.county} County · {city.region} · Priority #{city.priorityRank}</p>
        <ConfidenceBadge score={city.confidenceScore} />
      </div>

      <div className="intel-exec-summary card card-elevated mt-6" style={{ backgroundColor: theme.surfaceColor }}>
        <h2 className="font-display font-semibold" style={{ color: theme.primaryColor }}>Executive summary</h2>
        <p className="text-sm text-ark-pine/85 mt-2">{city.opportunityNotes || city.demographicsSummary}</p>
        {city.politicalNotes && <p className="text-sm text-muted mt-2">{city.politicalNotes}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card card-elevated">
            <h2 className="intel-section-title"><MapPin className="h-5 w-5" /> Demographics & economy</h2>
            <dl className="grid gap-3 sm:grid-cols-2 mt-4">
              <DataCard label="Population" value={city.population?.toLocaleString()} />
              <DataCard label="Demographics" value={city.demographicsSummary} />
              <DataCard label="Age profile" value={city.ageProfile} />
              <DataCard label="Income" value={city.incomeProfile} />
              <DataCard label="Employment" value={city.employmentProfile} />
              <DataCard label="Education" value={city.educationProfile} />
            </dl>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title">Civic institutions</h2>
            <ul className="mt-3 text-sm space-y-1 text-ark-pine/85">
              {[...(city.civicInstitutions ?? []), ...(city.churches ?? []), ...(city.schools ?? [])].map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title">Event calendar in {city.city}</h2>
            <div className="mt-3 space-y-3">
              {cityEvents.slice(0, 6).map((e) => (
                <Link key={e.id} to={`/event/${e.slug}`} className="block text-sm hover:bg-ark-wheat/50 rounded-lg px-2 py-1.5 -mx-2">
                  <span className="font-medium text-ark-pine">{e.title}</span>
                  <span className="text-muted block text-xs">{formatEventRange(e)}</span>
                </Link>
              ))}
              {cityEvents.length === 0 && <p className="text-sm intel-data-unknown">No events indexed — harvest gap</p>}
            </div>
          </section>

          {(city.recurringEvents?.length ?? 0) > 0 && (
            <section className="card card-elevated">
              <h2 className="intel-section-title">Recurring traditions</h2>
              <ul className="mt-2 text-sm space-y-1">{city.recurringEvents!.map((r) => <li key={r}>• {r}</li>)}</ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {countyDossier && (
            <section className="card card-elevated">
              <h2 className="intel-section-title text-sm">County context</h2>
              <Link to={`/campaigns/${workspace.slug}/county/${countySlug(city.county)}`} className="text-sm font-medium hover:underline" style={{ color: theme.accentColor }}>
                {city.county} County brief →
              </Link>
              <p className="text-xs text-muted mt-2">{countyDossier.demographicsSummary}</p>
            </section>
          )}

          <section className="card card-elevated intel-election-panel" style={{ borderLeft: `4px solid ${theme.accentColor}` }}>
            <h2 className="intel-section-title"><Target className="h-5 w-5" /> SOS / election math</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Baseline</dt><dd className="font-semibold">{city.sosBaselineVotes?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Target</dt><dd className="font-semibold">{city.sosTargetVotes?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Vote gap</dt><dd className="font-semibold">{gap?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Persuasion gap</dt><dd>{city.persuasionGap?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Turnout gap</dt><dd>{city.turnoutGap?.toLocaleString() ?? "—"}</dd></div>
            </dl>
            <p className="text-[10px] text-muted mt-3">Aggregate geography only — not individual voter targeting.</p>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title"><TrendingUp className="h-5 w-5" /> Local notes</h2>
            <ul className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {notes.map((n) => (
                <li key={n.id} className="text-xs bg-ark-wheat/50 rounded px-2 py-1.5">{n.noteText}</li>
              ))}
              {notes.length === 0 && <li className="text-xs intel-data-unknown">No campaign notes yet</li>}
            </ul>
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                addNote(new FormData(e.currentTarget).get("note") as string);
                e.currentTarget.reset();
              }}
            >
              <textarea name="note" rows={2} className="input text-xs" placeholder="Private field note…" />
              <button type="submit" className="btn-secondary text-xs py-1.5 mt-2 w-full">Save note</button>
            </form>
          </section>

          <section className="card card-elevated">
            <button type="button" disabled={aiLoading} className="btn-primary w-full text-sm" onClick={askAi}>
              <Brain className="h-4 w-4" /> {aiLoading ? "Analyzing…" : "Ask AI about this city"}
            </button>
            {summary && (
              <div className="mt-4 text-xs space-y-2 text-ark-pine/85">
                <p><strong>Why it matters:</strong> {summary.whyItMatters}</p>
                <p><strong>Relationship:</strong> {summary.relationshipGuidance}</p>
                <p className="text-muted">{summary.confidenceNotes}</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
