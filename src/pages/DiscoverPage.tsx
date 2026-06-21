import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Compass, CalendarDays, Map as MapIcon } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { CommunityPulse } from "../components/CommunityPulse";
import { DiscoveryHero } from "../components/discovery/DiscoveryHero";
import { DiscoveryChips } from "../components/discovery/DiscoveryChips";
import { PersonalityModeToggle } from "../components/discovery/PersonalityModeToggle";
import { EventFiltersBar } from "../components/EventFiltersBar";
import { fetchEvents } from "../lib/api";
import { filterByChip } from "../lib/discovery/eventDiscovery";
import { loadPersonalityMode } from "../lib/discovery/personalityStore";
import { busiestTownsThisWeekend } from "../lib/discovery/eventDiscovery";
import type { DiscoveryChipId, PersonalityMode, PublicDiscoveryAnswer } from "../lib/discovery/types";
import type { CivicEvent, EventFilters } from "../lib/types";
import { ImportantArkansasDatesBlock } from "../components/state-dates/ImportantArkansasDatesBlock";
import { upcomingStateDates } from "../lib/state-dates/stateDatesRegistry";
import { countySlug } from "../lib/counties";
import { formatCalendarDateParam } from "../lib/calendar/calendarUtils";
import { startOfMonth, startOfWeek } from "date-fns";

export function DiscoverPage() {
  const [mode, setMode] = useState<PersonalityMode>(() => loadPersonalityMode());
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChip, setActiveChip] = useState<DiscoveryChipId | null>(null);
  const [aiAnswer, setAiAnswer] = useState<PublicDiscoveryAnswer | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});

  useEffect(() => {
    fetchEvents({ limit: 500 })
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayed = useMemo(() => {
    let list = [...events];
    if (aiAnswer?.eventIds.length) {
      const idSet = new Set(aiAnswer.eventIds);
      list = list.filter((e) => idSet.has(e.id));
      list.sort((a, b) => aiAnswer.eventIds.indexOf(a.id) - aiAnswer.eventIds.indexOf(b.id));
    } else if (activeChip) {
      list = filterByChip(list, activeChip);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter((e) => `${e.title} ${e.description} ${e.city} ${e.county}`.toLowerCase().includes(q));
    }
    if (filters.county) list = list.filter((e) => e.county.toLowerCase() === filters.county!.toLowerCase());
    if (filters.city) list = list.filter((e) => e.city?.toLowerCase().includes(filters.city!.toLowerCase()));
    if (filters.category) list = list.filter((e) => e.category === filters.category);
    if (filters.thisWeekend) {
      list = list.filter((e) => {
        const d = new Date(e.startAt).getDay();
        return d === 0 || d === 6;
      });
    }
    if (filters.familyFriendly) list = list.filter((e) => e.isFamilyFriendly);
    if (filters.freeOnly) list = list.filter((e) => e.isFree);
    if (filters.featured) list = list.filter((e) => e.featured);
    return list;
  }, [events, activeChip, aiAnswer, filters]);

  const towns = useMemo(() => busiestTownsThisWeekend(events), [events]);
  const stateDates = useMemo(() => upcomingStateDates(6), []);
  const todayParam = formatCalendarDateParam(new Date());
  const weekStart = formatCalendarDateParam(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const monthStart = formatCalendarDateParam(startOfMonth(new Date()));

  return (
    <div>
      <section className="discovery-banner">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <p className="discovery-banner-kicker">Arkansas Community Calendar</p>
          <h1 className="discovery-banner-title">Let&apos;s go explore it.</h1>
          <p className="discovery-banner-sub max-w-xl">
            {mode === "citizen"
              ? "What should you do Saturday? Where is everybody going?"
              : mode === "candidate"
                ? "Where are the people? Find the rooms that matter."
                : "Discover gatherings, volunteers, and community momentum."}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/explore" className="btn-primary bg-ark-rust hover:bg-ark-clay">
              <Compass className="h-4 w-4" /> Explore Arkansas
            </Link>
            <Link to="/safari" className="btn-on-dark">
              Event Safari
            </Link>
            <Link to="/races" className="btn-on-dark">
              Race Circuit
            </Link>
            <Link to="/map" className="btn-on-dark">
              <MapIcon className="h-4 w-4" /> Map
            </Link>
            <Link to="/calendar/month" className="btn-on-dark">
              <CalendarDays className="h-4 w-4" /> View Calendar
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to={`/calendar/day?date=${todayParam}`} className="chip chip-muted text-xs text-white border-white/30 bg-white/10 hover:bg-white/20">
              Today
            </Link>
            <Link to={`/calendar/week?date=${weekStart}`} className="chip chip-muted text-xs text-white border-white/30 bg-white/10 hover:bg-white/20">
              This Week
            </Link>
            <Link to={`/calendar/month?date=${monthStart}`} className="chip chip-muted text-xs text-white border-white/30 bg-white/10 hover:bg-white/20">
              This Month
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <section className="card-readable">
          <Link to="/calendar/month" className="font-semibold text-ark-rust hover:underline flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Browse the full calendar — day, week, and month views
          </Link>
          <p className="text-muted text-sm mt-2">Filter by county, volunteer shifts, festivals, and more.</p>
        </section>

        <PersonalityModeToggle
          value={mode}
          onChange={(m) => {
            setMode(m);
            setActiveChip(null);
            setAiAnswer(null);
          }}
        />

        <DiscoveryHero
          events={events}
          mode={mode}
          onAnswer={(a) => {
            setAiAnswer(a);
            setActiveChip(null);
          }}
        />

        {aiAnswer && (
          <section className="card card-elevated border-l-4 border-ark-sage">
            <h2 className="font-display text-xl font-semibold text-ark-pine">{aiAnswer.headline}</h2>
            <p className="text-sm text-muted mt-2">{aiAnswer.summary}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {aiAnswer.followUpPrompts.slice(0, 3).map((p) => (
                <button key={p} type="button" className="discovery-example-chip" onClick={() => setAiAnswer(null)}>
                  {p}
                </button>
              ))}
              <button type="button" className="text-xs text-muted underline" onClick={() => setAiAnswer(null)}>Clear</button>
            </div>
          </section>
        )}

        <DiscoveryChips
          mode={mode}
          activeChip={activeChip}
          onSelect={(id) => {
            setActiveChip(id);
            setAiAnswer(null);
          }}
        />

        {!activeChip && !aiAnswer && (
          <ImportantArkansasDatesBlock dates={stateDates} />
        )}

        {towns.length > 0 && mode === "citizen" && !activeChip && !aiAnswer && (
          <section className="card bg-ark-wheat/40">
            <h3 className="font-semibold text-ark-pine">Towns alive this weekend</h3>
            <div className="flex flex-wrap gap-2 mt-3">
              {towns.map((t) => (
                <Link key={`${t.city}-${t.county}`} to={`/county/${countySlug(t.county)}`} className="chip chip-muted hover:border-ark-rust/40">
                  {t.city} · {t.count} events
                </Link>
              ))}
            </div>
          </section>
        )}

        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted hover:text-ark-pine"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <ChevronDown className={`h-4 w-4 transition ${showAdvanced ? "rotate-180" : ""}`} />
            Advanced filters
          </button>
          {showAdvanced && (
            <div className="mt-3">
              <EventFiltersBar filters={filters} onChange={setFilters} />
            </div>
          )}
        </div>

        {!loading && events.length > 0 && <CommunityPulse events={displayed.length ? displayed : events} />}

        <section>
          <h2 className="font-display text-2xl font-semibold text-ark-pine mb-4">
            {loading ? "Loading…" : `${displayed.length} discoveries`}
          </h2>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card h-48 animate-pulse bg-ark-wheat/50" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-muted">Nothing matched — try Event Safari or ask a different question.</p>
              <Link to="/safari" className="btn-primary mt-4 inline-flex">Start Event Safari</Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayed.map((e) => (
                <EventCard key={e.id} event={e} compact />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
