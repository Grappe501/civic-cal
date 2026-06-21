import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Radio } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { EventFiltersBar } from "../components/EventFiltersBar";
import { CommunityPulse } from "../components/CommunityPulse";
import { fetchEvents } from "../lib/api";
import type { CivicEvent, EventFilters } from "../lib/types";

export function HomePage() {
  const [filters, setFilters] = useState<EventFilters>({});
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEvents(filters)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const featured = events.filter((e) => e.featured);
  const feed = events.filter((e) => !e.featured || filters.featured);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ark-pine/10 bg-gradient-to-br from-ark-pine via-ark-pine to-[#1e3d32] text-ark-wheat">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#B84A32_0%,transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-wider">
            <Radio className="h-3.5 w-3.5" />
            Statewide civic calendar
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl max-w-3xl">
            What&apos;s happening in Arkansas — every county, every porch
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ark-wheat/80">
            Festivals, school boards, fish fries, volunteer shifts, and city hall meetings.
            Browse, share, and add what your town is doing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/submit" className="btn-primary bg-ark-rust hover:bg-ark-clay">
              Submit an Arkansas Event
            </Link>
            <Link to="/counties" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
              Browse by county
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <EventFiltersBar filters={filters} onChange={setFilters} />

        {!loading && events.length > 0 && <CommunityPulse events={events} />}

        {featured.length > 0 && !filters.featured && (
          <section>
            <h2 className="font-display text-2xl font-semibold text-ark-pine mb-4">Featured</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {featured.slice(0, 4).map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <h2 className="font-display text-2xl font-semibold text-ark-pine">
              {loading ? "Loading events…" : `${feed.length} events`}
            </h2>
          </div>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card h-48 animate-pulse bg-ark-wheat/50" />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-ark-pine/70">No events match your filters yet.</p>
              <Link to="/submit" className="btn-primary mt-4 inline-flex">
                Be the first to add one
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {feed.map((e) => (
                <EventCard key={e.id} event={e} compact />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
