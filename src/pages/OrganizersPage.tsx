import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Sparkles, Landmark, UtensilsCrossed, Trophy } from "lucide-react";
import { fetchEvents } from "../lib/api";
import { fetchIngestionCandidates } from "../lib/api-ingestion";
import { scoreEventOpportunity } from "../lib/intelligence/eventOpportunityScore";
import type { CivicEvent } from "../lib/types";
import type { IngestionCandidate } from "../lib/intelligence/types";
import { CategoryBadge } from "../components/CategoryBadge";
import { ARKANSAS_COUNTIES } from "../lib/counties";

function thisWeek(events: { startAt?: string; eventDate?: string | null }[]) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return events.filter((e) => {
    const raw = e.startAt || e.eventDate;
    if (!raw) return false;
    const d = new Date(raw);
    return d >= now && d <= end;
  });
}

function OpportunityCard({
  title,
  subtitle,
  score,
  href,
}: {
  title: string;
  subtitle: string;
  score?: number;
  href?: string;
}) {
  const inner = (
    <div className="card hover:border-ark-sage transition">
      <div className="flex justify-between gap-2">
        <h3 className="font-semibold text-ark-pine leading-snug">{title}</h3>
        {score != null && (
          <span className="chip bg-ark-rust/15 text-ark-rust shrink-0">{score}</span>
        )}
      </div>
      <p className="text-sm text-ark-pine/60 mt-1">{subtitle}</p>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

export function OrganizersPage() {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [candidates, setCandidates] = useState<IngestionCandidate[]>([]);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error);
    fetchIngestionCandidates("high_civic_value").then(setCandidates).catch(console.error);
  }, []);

  const weekEvents = useMemo(() => thisWeek(events) as CivicEvent[], [events]);
  const weekCandidates = useMemo(() => thisWeek(candidates) as IngestionCandidate[], [candidates]);

  const topOpportunities = useMemo(() => {
    const merged = [
      ...candidates.map((c) => ({
        kind: "candidate" as const,
        title: c.title,
        subtitle: [c.city, c.county ? `${c.county} County` : null, c.eventDate || "confirm date"].filter(Boolean).join(" · "),
        score: c.politicalOpportunityScore ?? scoreEventOpportunity({ title: c.title, category: c.category ?? undefined, civicValue: c.civicValue ?? undefined, description: c.notes ?? undefined, isRecurringAnnual: c.isRecurringAnnual, reviewStatus: c.reviewStatus }),
        href: undefined,
      })),
      ...events.map((e) => ({
        kind: "event" as const,
        title: e.title,
        subtitle: `${e.city || e.county} County`,
        score: scoreEventOpportunity({ title: e.title, category: e.category, description: e.description ?? undefined, isPublicGovernmentMeeting: e.isPublicGovernmentMeeting, candidateRelevant: e.candidateRelevant }),
        href: `/event/${e.slug}`,
      })),
    ];
    return merged.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 12);
  }, [candidates, events]);

  const byCounty = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of candidates) {
      if (!c.county) continue;
      m.set(c.county, (m.get(c.county) ?? 0) + 1);
    }
    for (const e of events) {
      m.set(e.county, (m.get(e.county) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [candidates, events]);

  const gov = candidates.filter((c) => c.category === "civic_meeting");
  const church = candidates.filter((c) => c.category === "faith_meal");
  const festivals = [...candidates, ...events.map((e) => ({ title: e.title, county: e.county, category: e.category }))].filter(
    (x) => x.category === "community",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-ark-sage">For candidates & organizers</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-ark-pine mt-1">
        Where should leaders be?
      </h1>
      <p className="mt-2 text-ark-pine/70 max-w-2xl">
        Highest-value civic touchpoints across Arkansas — meetings, meals, festivals, and traditions worth showing up for.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2 text-ark-pine">
          <Sparkles className="h-5 w-5 text-ark-rust" />
          This weekend — top opportunities
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {topOpportunities.slice(0, 6).map((o, i) => (
            <OpportunityCard key={i} title={o.title} subtitle={o.subtitle} score={o.score} href={o.href} />
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> This week (live events)
          </h2>
          <ul className="mt-3 space-y-2">
            {weekEvents.slice(0, 8).map((e) => (
              <li key={e.id}>
                <Link to={`/event/${e.slug}`} className="text-sm text-ark-pine hover:text-ark-rust">
                  {e.title} — {e.county} County
                </Link>
              </li>
            ))}
            {weekEvents.length === 0 && <li className="text-sm text-ark-pine/50">No dated events this week in feed.</li>}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" /> County pulse
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {byCounty.map(([county, n]) => (
              <li key={county} className="flex justify-between">
                <Link to={`/county/${county.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-ark-rust">
                  {county} County
                </Link>
                <span className="text-ark-pine/50">{n}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ark-pine/40 mt-2">
            {ARKANSAS_COUNTIES.length - byCounty.length} counties need more intelligence harvests.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Landmark className="h-5 w-5" /> Government meetings
          </h2>
          <ul className="mt-2 space-y-2 text-sm">
            {gov.slice(0, 5).map((c) => (
              <li key={c.id}>{c.title}</li>
            ))}
            {gov.length === 0 && <li className="text-ark-pine/50">Harvest city/county calendars to populate.</li>}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" /> Church & community meals
          </h2>
          <ul className="mt-2 space-y-2 text-sm">
            {church.map((c) => (
              <li key={c.id}>
                <span className="font-medium">{c.title}</span>
                <span className="text-ark-pine/50"> — {c.city}, {c.county} Co.</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Festivals & fairs
          </h2>
          <p className="text-sm text-ark-pine/60 mt-2">{festivals.length} community events in pipeline + feed.</p>
          <Link to="/map" className="btn-secondary mt-3 inline-flex text-xs">View on map</Link>
        </div>
      </section>

      {weekCandidates.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Staged intelligence (awaiting review)</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {weekCandidates.slice(0, 4).map((c) => (
              <div key={c.id} className="card">
                <CategoryBadge category={(c.category as CivicEvent["category"]) || "community"} />
                <p className="font-medium mt-2">{c.title}</p>
                <p className="text-xs text-ark-pine/50">{c.reviewStatus}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
