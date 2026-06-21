import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Brain, Calendar, MapPin, MessageSquarePlus, Sparkles, Users } from "lucide-react";
import { isThisWeek } from "date-fns";
import { fetchEvents } from "../../lib/api";
import { applyDistrictScope, isBoundaryPending } from "../../lib/campaigns/districtScope";
import { scoreEventForCampaign, traditionStrengthEstimate, verificationLabel } from "../../lib/campaigns/eventIntel";
import { buildPlan, loadPlansForCampaign, savePlanForCampaign } from "../../lib/campaigns/planStore";
import type { CampaignEventPlan, CampaignWorkspace, PlanStatus, ScoredEvent } from "../../lib/campaigns/types";
import { PLAN_STATUS_LABELS, PLAN_STATUS_SHORT } from "../../lib/campaigns/types";
import { dashboardThemeVars } from "../../lib/campaigns/workspaces";
import { formatEventRange } from "../../lib/format";
import { GoogleCalendarRail, MobilizeRail } from "../integrations/IntegrationRails";
import type { IntelligenceLayer } from "../../lib/intelligence/eventLayers";
import { LayerBadge, DensityBadge } from "../intelligence/LayerBadge";

interface Props {
  workspace: CampaignWorkspace;
}

type SectionId =
  | "summary"
  | "week"
  | "density"
  | "church"
  | "gov"
  | "festivals"
  | "school"
  | "planned"
  | "volunteers";

const PLAN_STATUSES: PlanStatus[] = [
  "considering",
  "attending",
  "candidate_should_attend",
  "surrogate_should_attend",
  "needs_volunteers",
  "skip",
  "needs_research",
];

function EventIntelCard({
  item,
  plans,
  onPlan,
  compact,
}: {
  item: ScoredEvent;
  plans: Record<string, CampaignEventPlan>;
  onPlan: (eventId: string, status: PlanStatus) => void;
  compact?: boolean;
}) {
  const { event, politicalOpportunityScore, relationshipDensityScore, candidateUsefulness, layer } = item;
  const tradition = traditionStrengthEstimate(event);
  const verification = verificationLabel(event);
  const plan = plans[event.id];

  return (
    <div className="card border-l-4" style={{ borderLeftColor: "var(--campaign-accent)" }}>
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <Link to={`/event/${event.slug}`} className="font-semibold text-ark-pine hover:opacity-80">
            {event.title}
          </Link>
          <p className="text-xs text-ark-pine/50 mt-1">
            {formatEventRange(event)} · {event.city || event.county} County
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <LayerBadge layer={layer as IntelligenceLayer} compact />
          <span className="chip text-[10px]" style={{ backgroundColor: "var(--campaign-surface)", color: "var(--campaign-primary)" }}>
            PO {politicalOpportunityScore}
          </span>
          <DensityBadge score={relationshipDensityScore} />
        </div>
      </div>

      {!compact && (
        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
          <span className="chip bg-ark-wheat text-ark-pine">Usefulness: {candidateUsefulness}</span>
          {tradition != null && <span className="chip bg-ark-wheat text-ark-pine">Tradition ~{tradition}</span>}
          <span className="chip bg-ark-wheat text-ark-pine capitalize">{verification.replace("_", " ")}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1">
        {PLAN_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            title={PLAN_STATUS_LABELS[status]}
            onClick={() => onPlan(event.id, status)}
            className={
              plan?.planStatus === status
                ? "chip text-[10px] text-white"
                : "chip text-[10px] bg-ark-wheat text-ark-pine"
            }
            style={plan?.planStatus === status ? { backgroundColor: "var(--campaign-primary)" } : undefined}
          >
            {PLAN_STATUS_SHORT[status]}
          </button>
        ))}
        <Link
          to={`/event/${event.slug}`}
          className="chip text-[10px] bg-ark-sage/20 text-ark-pine inline-flex items-center gap-1"
          title="Request local feedback on event page"
        >
          <MessageSquarePlus className="h-3 w-3" /> Local intel
        </Link>
      </div>
    </div>
  );
}

export function CampaignDashboard({ workspace }: Props) {
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchEvents>>>([]);
  const [plans, setPlans] = useState<Record<string, CampaignEventPlan>>(() => loadPlansForCampaign(workspace.slug));
  const [section, setSection] = useState<SectionId>("summary");

  const theme = workspace.dashboardTheme;
  const vars = dashboardThemeVars(theme);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error);
  }, []);

  useEffect(() => {
    setPlans(loadPlansForCampaign(workspace.slug));
  }, [workspace.slug]);

  const scopeResult = useMemo(() => applyDistrictScope(events, workspace), [events, workspace]);
  const scored = useMemo(() => scopeResult.events.map(scoreEventForCampaign), [scopeResult.events]);

  const thisWeek = useMemo(() => scored.filter(({ event }) => isThisWeek(new Date(event.startAt), { weekStartsOn: 0 })), [scored]);
  const topOpportunity = useMemo(
    () => [...scored].sort((a, b) => b.politicalOpportunityScore - a.politicalOpportunityScore).slice(0, 8),
    [scored],
  );
  const topDensity = useMemo(
    () => [...scored].sort((a, b) => b.relationshipDensityScore - a.relationshipDensityScore).slice(0, 8),
    [scored],
  );
  const church = useMemo(() => scored.filter(({ layer }) => layer === "community_church").slice(0, 8), [scored]);
  const gov = useMemo(
    () => scored.filter(({ layer, event }) => layer === "government" || event.category === "civic_meeting").slice(0, 8),
    [scored],
  );
  const festivals = useMemo(() => scored.filter(({ layer }) => layer === "community_identity").slice(0, 8), [scored]);
  const school = useMemo(() => scored.filter(({ layer }) => layer === "school_ecosystem").slice(0, 8), [scored]);
  const planned = useMemo(
    () => scored.filter(({ event }) => plans[event.id] && !["skip", "needs_research"].includes(plans[event.id].planStatus)),
    [scored, plans],
  );
  const volunteers = useMemo(
    () => scored.filter(({ event }) => plans[event.id]?.planStatus === "needs_volunteers"),
    [scored, plans],
  );

  function handlePlan(eventId: string, planStatus: PlanStatus) {
    const plan = buildPlan(eventId, planStatus, plans[eventId]);
    savePlanForCampaign(workspace.slug, eventId, plan);
    setPlans({ ...plans, [eventId]: plan });
  }

  const sections: { id: SectionId; label: string; count: number }[] = [
    { id: "summary", label: "Command summary", count: scored.length },
    { id: "week", label: "This week", count: thisWeek.length },
    { id: "density", label: "Highest RD", count: topDensity.length },
    { id: "church", label: "Church meals", count: church.length },
    { id: "gov", label: "Government", count: gov.length },
    { id: "festivals", label: "Festivals", count: festivals.length },
    { id: "school", label: "School", count: school.length },
    { id: "planned", label: "Planned", count: planned.length },
    { id: "volunteers", label: "Needs volunteers", count: volunteers.length },
  ];

  let list: ScoredEvent[] = topOpportunity;
  if (section === "week") list = thisWeek;
  else if (section === "density") list = topDensity;
  else if (section === "church") list = church;
  else if (section === "gov") list = gov;
  else if (section === "festivals") list = festivals;
  else if (section === "school") list = school;
  else if (section === "planned") list = planned;
  else if (section === "volunteers") list = volunteers;

  return (
    <div style={vars as React.CSSProperties}>
      <div
        className="rounded-2xl p-6 md:p-8 text-white mb-8"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 mb-3">
              {theme.badgeLabel}
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{workspace.dashboardLabel}</h1>
            <p className="mt-2 text-white/90 max-w-xl">{theme.heroTagline}</p>
            <p className="mt-1 text-sm text-white/70">{workspace.candidateName} · {workspace.officeSought}</p>
          </div>
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold shrink-0"
            style={{ backgroundColor: theme.surfaceColor, color: theme.primaryColor }}
          >
            {theme.logoInitials}
          </div>
        </div>
      </div>

      {isBoundaryPending(workspace) && (
        <div className="card mb-6 flex gap-3 items-start border-amber-200 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <strong>Boundary precision pending.</strong> {workspace.districtScope.boundaryNote}
          </div>
        </div>
      )}

      {section === "summary" && (
        <section className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { label: "Events in scope", value: scopeResult.events.length, icon: MapPin },
            { label: "This week", value: thisWeek.length, icon: Calendar },
            { label: "Planned", value: planned.length, icon: Sparkles },
            { label: "Volunteer needs", value: volunteers.length, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card" style={{ backgroundColor: theme.surfaceColor }}>
              <Icon className="h-5 w-5" style={{ color: theme.accentColor }} />
              <p className="text-2xl font-bold mt-2" style={{ color: theme.primaryColor }}>{value}</p>
              <p className="text-sm text-ark-pine/60">{label}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-4">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={section === s.id ? "chip text-white text-xs" : "chip bg-ark-wheat text-ark-pine text-xs"}
                style={section === s.id ? { backgroundColor: theme.primaryColor } : undefined}
              >
                {s.label} ({s.count})
              </button>
            ))}
          </div>

          {section === "summary" ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold flex items-center gap-2" style={{ color: theme.primaryColor }}>
                  <Sparkles className="h-5 w-5" /> This week&apos;s best opportunities
                </h2>
                <div className="mt-3 space-y-3">
                  {(thisWeek.length ? thisWeek : topOpportunity).slice(0, 5).map((item) => (
                    <EventIntelCard key={item.event.id} item={item} plans={plans} onPlan={handlePlan} compact />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold flex items-center gap-2" style={{ color: theme.primaryColor }}>
                  <Brain className="h-5 w-5" /> Highest relationship density
                </h2>
                <div className="mt-3 space-y-3">
                  {topDensity.slice(0, 4).map((item) => (
                    <EventIntelCard key={item.event.id} item={item} plans={plans} onPlan={handlePlan} compact />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {list.slice(0, 12).map((item) => (
                <EventIntelCard key={item.event.id} item={item} plans={plans} onPlan={handlePlan} />
              ))}
              {list.length === 0 && <p className="text-ark-pine/60">No events in this section for current scope.</p>}
            </div>
          )}

          <p className="text-xs text-ark-pine/50 mt-4">
            Scope: {scopeResult.scopeLabel} · {scopeResult.totalBeforeFilter} total events in feed
          </p>
        </div>

        <div className="space-y-4">
          <div className="card" style={{ backgroundColor: theme.surfaceColor }}>
            <h3 className="font-semibold" style={{ color: theme.primaryColor }}>AI & local intelligence</h3>
            <p className="text-sm text-ark-pine/70 mt-2">
              PO/RD scores are deterministic; admin AI assessments available in Event Intelligence tab.
              Use &quot;Local intel&quot; on any event to request community feedback.
            </p>
            <Link to="/opportunity-engine" className="text-xs mt-2 inline-block hover:underline" style={{ color: theme.accentColor }}>
              How scoring works →
            </Link>
          </div>
          <GoogleCalendarRail />
          <MobilizeRail />
          {workspace.notes && (
            <div className="card text-sm text-ark-pine/70">
              <strong className="text-ark-pine">Workspace notes</strong>
              <p className="mt-1">{workspace.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
