import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Brain,
  Building2,
  Calendar,
  MapPin,
  Megaphone,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import type { CountyOpportunityAnalysis, CountyRollupView, LocalIntelligenceSummary } from "../../lib/local-intelligence/types";
import { citySlug, voteTargetGap } from "../../lib/local-intelligence/registry";
import type { CivicEvent } from "../../lib/types";
import { scoreEventForCampaign } from "../../lib/campaigns/eventIntel";
import { CommunityInstitutionsLayerPanel } from "../institutions/CommunityInstitutionsLayerPanel";
import { CommunityStrengthPanel } from "../institutions/CommunityStrengthPanel";
import { InstitutionCoveragePanel } from "../institutions/InstitutionCoveragePanel";
import { SportsHubPanel } from "../institutions/SportsHubPanel";
import { CommunityAnchorsPanel } from "../institutions/CommunityAnchorsPanel";

interface Props {
  workspace: CampaignWorkspace;
  rollup: CountyRollupView;
  events: CivicEvent[];
  summary?: LocalIntelligenceSummary | null;
  opportunity?: CountyOpportunityAnalysis;
  onGenerateBrief?: () => void;
  aiLoading?: boolean;
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-ark-sage mb-2">{title}</h4>
      <ul className="text-sm space-y-1 text-ark-pine/85">
        {items.slice(0, 8).map((x) => <li key={x}>• {x}</li>)}
        {items.length === 0 && <li className="intel-data-unknown text-sm">{empty ?? "Pending harvest / verification"}</li>}
      </ul>
    </div>
  );
}

function EventLinks({ items, events }: { items: string[]; events: CivicEvent[] }) {
  if (items.length === 0) return <p className="text-sm intel-data-unknown">None indexed</p>;
  return (
    <ul className="text-sm space-y-1.5">
      {items.slice(0, 6).map((label) => {
        const match = events.find((e) => label.startsWith(e.title));
        if (match) {
          return (
            <li key={label}>
              <Link to={`/event/${match.slug}`} className="font-medium hover:underline text-ark-pine">{label}</Link>
            </li>
          );
        }
        return <li key={label} className="text-ark-pine/80">{label}</li>;
      })}
    </ul>
  );
}

export function CountyRollupBrief({ workspace, rollup, events, summary, opportunity, onGenerateBrief, aiLoading }: Props) {
  const { dossier, cities, events: eventRollup, candidateActivity, communityLayer, communityAnchors, sportsHub } = rollup;
  const theme = workspace.dashboardTheme;
  const gap = voteTargetGap(dossier);
  const demo = dossier.demographics;
  const pol = dossier.political;
  const inst = dossier.institutions;
  const media = dossier.media;
  const opp = opportunity ?? summary?.opportunity;

  const topRd = [...events]
    .map((e) => ({ event: e, scored: scoreEventForCampaign(e) }))
    .sort((a, b) => b.scored.relationshipDensityScore - a.scored.relationshipDensityScore)
    .slice(0, 6);

  return (
    <div className="intel-brief county-rollup-brief">
      <div className="intel-hero" style={{ borderTopColor: theme.primaryColor }}>
        <p className="section-kicker">County Rollup 2.0 · candidate-only · not public</p>
        <h1 className="page-header">{dossier.county} County</h1>
        <p className="text-muted">
          {dossier.region} · Seat: {dossier.countySeat || "Verify"} · {cities.length} city feeders
        </p>
        <span className="chip chip-muted text-[10px] mt-2">Confidence {dossier.confidenceScore}% · v{dossier.rollupVersion ?? 2}</span>
      </div>

      <div className="intel-exec-summary card card-elevated mt-6" style={{ backgroundColor: theme.surfaceColor }}>
        <h2 className="font-display font-semibold" style={{ color: theme.primaryColor }}>
          Everything known about {dossier.county} County
        </h2>
        {dossier.demographicsSummary && <p className="text-sm text-ark-pine/85 mt-2">{dossier.demographicsSummary}</p>}
        <p className="text-xs text-muted mt-2">Community institutions layer — churches, schools, colleges, orgs, sports</p>
        {dossier.winPathNotes && <p className="text-sm mt-2 font-medium">{dossier.winPathNotes}</p>}
        {onGenerateBrief && (
          <button type="button" disabled={aiLoading} className="btn-primary text-sm mt-4" onClick={onGenerateBrief}>
            <Brain className="h-4 w-4" /> {aiLoading ? "Generating brief…" : `Generate ${dossier.county} County Brief`}
          </button>
        )}
      </div>

      {opp && (
        <section className="card card-elevated mt-6 border-l-4 border-ark-rust">
          <h2 className="intel-section-title"><TrendingUp className="h-5 w-5" /> Opportunity analysis</h2>
          <div className="grid gap-4 md:grid-cols-2 mt-4 text-sm">
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs font-bold uppercase text-emerald-800">Biggest opportunity</p>
              <p className="mt-1 text-ark-pine">{opp.biggestOpportunity}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase text-amber-800">Biggest risk</p>
              <p className="mt-1 text-ark-pine">{opp.biggestRisk}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <ListBlock title="Missing relationships" items={opp.missingRelationships} />
            <ListBlock title="High-value institutions not visited" items={opp.highValueInstitutionsNotVisited} />
            <ListBlock title="Events missing from calendar" items={opp.eventsMissingFromCalendar} />
            <ListBlock title="Untapped volunteer opportunities" items={opp.untappedVolunteerOpportunities} />
          </div>
        </section>
      )}

      {communityLayer && (
        <>
          <CommunityStrengthPanel strength={communityLayer.strength} />
          <InstitutionCoveragePanel coverage={communityLayer.coverage} />
          <CommunityInstitutionsLayerPanel layer={communityLayer} />
        </>
      )}

      {communityAnchors && (
        <CommunityAnchorsPanel anchors={communityAnchors} themePrimary={theme.primaryColor} />
      )}

      {sportsHub && <SportsHubPanel hub={sportsHub} />}

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card card-elevated">
            <h2 className="intel-section-title"><Users className="h-5 w-5" /> Demographics</h2>
            <dl className="grid gap-3 sm:grid-cols-2 mt-4">
              {[
                ["Population", demo?.population?.toLocaleString()],
                ["Growth", demo?.growthTrend],
                ["Age", demo?.ageDistribution],
                ["Income", demo?.income],
                ["Education", demo?.education],
                ["Housing", demo?.housing],
                ["Race/ethnicity", demo?.raceEthnicity],
                ["Employment", demo?.employment],
                ["Industry", demo?.industry],
                ["Migration", demo?.migration],
              ].map(([label, value]) => (
                <div key={label} className="intel-data-card">
                  <dt className="intel-data-label">{label}</dt>
                  <dd className={value ? "intel-data-value" : "intel-data-unknown"}>{value || "ACS pending"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title"><MapPin className="h-5 w-5" /> Cities feeding this county</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {cities.map((t) => (
                <Link
                  key={t.city}
                  to={`/campaigns/${workspace.slug}/city/${citySlug(t.city)}`}
                  className="chip chip-muted hover:border-ark-rust/40"
                  title={`Priority #${t.priorityRank}`}
                >
                  #{t.priorityRank} {t.city}
                </Link>
              ))}
              {cities.length === 0 && <p className="text-sm intel-data-unknown">No priority cities in registry — expand top-250</p>}
            </div>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title"><Calendar className="h-5 w-5" /> Events ({eventRollup.upcomingCount} upcoming)</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div><h4 className="text-xs font-bold uppercase text-muted mb-1">Government</h4><EventLinks items={eventRollup.government} events={events} /></div>
              <div><h4 className="text-xs font-bold uppercase text-muted mb-1">Church / faith</h4><EventLinks items={eventRollup.church} events={events} /></div>
              <div><h4 className="text-xs font-bold uppercase text-muted mb-1">Festivals</h4><EventLinks items={eventRollup.festivals} events={events} /></div>
              <div><h4 className="text-xs font-bold uppercase text-muted mb-1">Volunteer</h4><EventLinks items={eventRollup.volunteer} events={events} /></div>
              <div><h4 className="text-xs font-bold uppercase text-muted mb-1">Recurring</h4><EventLinks items={eventRollup.recurring} events={events} /></div>
              <div><h4 className="text-xs font-bold uppercase text-muted mb-1">Parades</h4><EventLinks items={eventRollup.parades} events={events} /></div>
              <div><h4 className="text-xs font-bold uppercase text-muted mb-1">Food trail</h4><EventLinks items={eventRollup.foodEvents} events={events} /></div>
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

          <section className="card card-elevated">
            <h2 className="intel-section-title"><Building2 className="h-5 w-5" /> Community institutions</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <ListBlock title="Churches" items={inst?.churches ?? []} />
              <ListBlock title="Schools" items={inst?.schools ?? []} />
              <ListBlock title="Libraries & colleges" items={[...(inst?.libraries ?? []), ...(inst?.colleges ?? [])]} />
              <ListBlock title="Civic clubs" items={[...(inst?.rotary ?? []), ...(inst?.lions ?? []), ...(inst?.kiwanis ?? [])]} />
              <ListBlock title="Ag & youth" items={[...(inst?.farmBureau ?? []), ...(inst?.ffa ?? []), ...(inst?.fourH ?? [])]} />
              <ListBlock title="Chambers & VFD" items={[...(inst?.chambers ?? []), ...(inst?.volunteerFireDepartments ?? [])]} />
            </div>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title"><Megaphone className="h-5 w-5" /> Media</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <ListBlock title="Newspapers" items={media?.newspapers ?? []} />
              <ListBlock title="Radio" items={media?.radio ?? []} />
              <ListBlock title="Facebook / groups" items={[...(media?.facebookPages ?? []), ...(media?.communityGroups ?? [])]} />
              <ListBlock title="Newsletters & podcasts" items={[...(media?.newsletters ?? []), ...(media?.podcasts ?? [])]} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card card-elevated intel-election-panel" style={{ borderLeft: `4px solid ${theme.accentColor}` }}>
            <h2 className="intel-section-title"><Target className="h-5 w-5" /> Political math</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">SOS turnout</dt><dd className="text-xs">{pol?.sosTurnout ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Baseline</dt><dd>{pol?.baselineVotes?.toLocaleString() ?? dossier.priorSosBaseline?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Target</dt><dd>{pol?.voteTargets?.toLocaleString() ?? dossier.targetVotes?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Vote deficit</dt><dd className="font-semibold">{pol?.voteDeficit?.toLocaleString() ?? gap?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Persuasion targets</dt><dd>{pol?.persuasionTargets?.toLocaleString() ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Turnout targets</dt><dd>{pol?.turnoutTargets?.toLocaleString() ?? "—"}</dd></div>
            </dl>
            <p className="text-[10px] text-muted mt-3">Aggregate geography only — not individual voter targeting.</p>
          </section>

          <section className="card card-elevated">
            <h2 className="intel-section-title"><Users className="h-5 w-5" /> Candidate activity</h2>
            <dl className="text-sm space-y-2 mt-2">
              <div className="flex justify-between"><dt className="text-muted">Planned attendance</dt><dd>{candidateActivity.attendedCount}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Skipped</dt><dd>{candidateActivity.skippedCount}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Considering</dt><dd>{candidateActivity.consideringCount}</dd></div>
            </dl>
            {candidateActivity.attendedCount === 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1.5 mt-2 flex gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> No presence planned in this county
              </p>
            )}
            <ListBlock title="Coverage notes" items={candidateActivity.eventCoverageNotes} empty="No plans logged yet" />
          </section>

          {summary && (
            <section className="card card-elevated text-xs space-y-2 text-ark-pine/85">
              <p><strong>Why it matters:</strong> {summary.whyItMatters}</p>
              <p><strong>Guidance:</strong> {summary.relationshipGuidance}</p>
              <p className="text-muted">{summary.confidenceNotes}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
