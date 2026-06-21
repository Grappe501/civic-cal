import { Link } from "react-router-dom";
import { AlertCircle, Calendar, MapPin, Users, Zap } from "lucide-react";
import { analyzeCalendarGaps, recommendedNextEvents } from "../../lib/campaigns/calendarGapAnalyzer";
import type { ClassifiedCampaignEvent } from "../../lib/campaigns/districtScope";
import type { CampaignEventPlan, CampaignWorkspace } from "../../lib/campaigns/types";
import { formatEventRange } from "../../lib/format";

interface Props {
  workspace: CampaignWorkspace;
  classified: ClassifiedCampaignEvent[];
  plans: Record<string, CampaignEventPlan>;
  themePrimary: string;
  themeAccent: string;
}

export function CampaignStrategyPanel({ workspace, classified, plans, themePrimary, themeAccent }: Props) {
  const analysis = analyzeCalendarGaps(classified, plans, workspace);
  const nextFive = recommendedNextEvents(classified, plans, 5);
  const topRd = [...classified].sort((a, b) => b.scored.relationshipDensityScore - a.scored.relationshipDensityScore).slice(0, 4);
  const topCrowd = [...classified]
    .filter((c) => /fair|festival|parade|homecoming/.test(c.scored.event.title.toLowerCase()))
    .slice(0, 4);
  const volunteerEvents = classified.filter((c) => c.scored.politicalOpportunityScore >= 60).slice(0, 4);
  const worthTrip = classified.filter(
    (c) => c.zone === "near" || (c.zone === "outside" && c.scored.politicalOpportunityScore >= 70),
  ).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="card card-elevated" style={{ borderTop: `3px solid ${themeAccent}` }}>
        <h3 className="font-display font-semibold flex items-center gap-2" style={{ color: themePrimary }}>
          <Zap className="h-5 w-5" /> AI Strategy Panel
        </h3>
        <p className="text-xs text-muted mt-1">Turn the calendar up — gaps, rooms, and deployment priorities.</p>
      </div>

      <Section title="Recommended next 5 events" icon={Zap} color={themePrimary}>
        {nextFive.map((c) => (
          <MiniEvent key={c.scored.event.id} classified={c} />
        ))}
        {nextFive.length === 0 && <p className="text-xs text-muted">All top events have plans — nice work.</p>}
      </Section>

      <Section title="Biggest calendar gaps" icon={Calendar} color={themeAccent}>
        {analysis.gaps.slice(0, 4).map((g) => (
          <div key={g.label} className="text-xs rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 mb-2">
            <span className="font-semibold text-amber-900">{g.label}</span>
            <p className="text-amber-800/80 mt-0.5">{g.detail}</p>
          </div>
        ))}
        {analysis.gaps.length === 0 && <p className="text-xs text-muted">No major gaps detected this week.</p>}
      </Section>

      <Section title="Best relationship-density rooms" icon={Users} color={themePrimary}>
        {topRd.map((c) => (
          <MiniEvent key={c.scored.event.id} classified={c} showRd />
        ))}
      </Section>

      {topCrowd.length > 0 && (
        <Section title="Best public crowd events" icon={MapPin} color={themeAccent}>
          {topCrowd.map((c) => (
            <MiniEvent key={c.scored.event.id} classified={c} />
          ))}
        </Section>
      )}

      <Section title="Events needing volunteers" icon={Users} color={themePrimary}>
        {volunteerEvents.slice(0, 3).map((c) => (
          <MiniEvent key={c.scored.event.id} classified={c} />
        ))}
      </Section>

      {worthTrip.length > 0 && (
        <Section title="Worth the trip" icon={AlertCircle} color={themeAccent}>
          {worthTrip.map((c) => (
            <MiniEvent key={c.scored.event.id} classified={c} />
          ))}
        </Section>
      )}

      <div className="card text-xs text-muted">
        <strong className="text-ark-pine">District coverage:</strong> {analysis.districtCoveragePct}% of inside-district events planned
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  icon: typeof Zap;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2" style={{ color }}>
        <Icon className="h-4 w-4" /> {title}
      </h4>
      {children}
    </div>
  );
}

function MiniEvent({ classified, showRd }: { classified: ClassifiedCampaignEvent; showRd?: boolean }) {
  const { event, politicalOpportunityScore, relationshipDensityScore } = classified.scored;
  return (
    <Link
      to={`/event/${event.slug}`}
      className="block text-xs rounded-lg hover:bg-ark-wheat/60 px-2 py-1.5 -mx-2 transition"
    >
      <span className="font-medium text-ark-pine">{event.title}</span>
      <span className="text-muted block">{formatEventRange(event)}</span>
      <span className="text-[10px] text-ark-sage">
        PO {politicalOpportunityScore}
        {showRd && ` · RD ${relationshipDensityScore}`}
      </span>
    </Link>
  );
}
