import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, Sparkles, Target, Users } from "lucide-react";
import type { MorningCampaignBrief } from "../../lib/ai/morningCampaignBrief";

interface Props {
  brief: MorningCampaignBrief;
  themePrimary: string;
  themeAccent: string;
}

const ICONS = {
  alert: AlertTriangle,
  opportunity: Sparkles,
  gap: Target,
  conflict: CalendarClock,
  opponent: Users,
  institution: Target,
  volunteer: Users,
};

export function CampaignMorningBrief({ brief, themePrimary, themeAccent }: Props) {
  if (brief.insights.length === 0 && brief.topEventsThisWeek.length === 0) return null;

  return (
    <section className="card card-elevated mb-8 border-l-4 campaign-morning-brief" style={{ borderLeftColor: themeAccent, backgroundColor: "var(--campaign-surface)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">This morning for {brief.candidateName}</p>
          <h2 className="font-display text-xl font-semibold mt-1" style={{ color: themePrimary }}>
            {brief.generatedFor}
          </h2>
        </div>
        <span className="chip chip-muted text-[10px]">Not “42 events” — actionable intelligence</span>
      </div>

      <ul className="mt-4 space-y-2">
        {brief.insights.map((insight, i) => {
          const Icon = ICONS[insight.type] ?? Sparkles;
          return (
            <li
              key={i}
              className={`flex gap-3 text-sm rounded-lg px-3 py-2 ${
                insight.severity === "high" ? "bg-amber-50 text-amber-950" : "bg-white/80 text-ark-pine/90"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: themeAccent }} />
              <span>
                {insight.eventSlug ? (
                  <>
                    <Link to={`/event/${insight.eventSlug}`} className="font-medium hover:underline">{insight.message.split("—")[0]}</Link>
                    {insight.message.includes("—") ? ` — ${insight.message.split("—").slice(1).join("—")}` : ""}
                  </>
                ) : (
                  insight.message
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {brief.topEventsThisWeek.length > 0 && (
        <div className="mt-4 pt-4 border-t border-ark-pine/10">
          <p className="text-xs font-semibold uppercase text-muted mb-2">Top events this week</p>
          <div className="flex flex-wrap gap-2">
            {brief.topEventsThisWeek.map((e) => (
              <Link key={e.slug} to={`/event/${e.slug}`} className="chip chip-muted hover:border-ark-rust/40 text-xs">
                RD {e.rd} · {e.title.slice(0, 40)}{e.title.length > 40 ? "…" : ""}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
