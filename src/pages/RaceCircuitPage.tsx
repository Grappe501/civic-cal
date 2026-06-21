import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EventCard } from "../components/EventCard";
import { RaceCircuitHeader } from "../components/discovery/RaceCircuitHeader";
import { fetchEvents } from "../lib/api";
import { filterRaces } from "../lib/discovery/eventDiscovery";
import type { RaceCategoryId } from "../lib/discovery/types";

export function RaceCircuitPage() {
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchEvents>>>([]);
  const [category, setCategory] = useState<RaceCategoryId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const races = useMemo(() => filterRaces(events, category ?? undefined), [events, category]);
  const allRaces = useMemo(() => filterRaces(events), [events]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <RaceCircuitHeader activeCategory={category} onCategoryChange={setCategory} raceCount={allRaces.length} />

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ark-pine mb-4">
          {loading ? "Loading races…" : `${races.length} races`}
        </h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="card h-40 animate-pulse bg-ark-wheat/50" />)}
          </div>
        ) : races.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted">No races indexed yet — submit turkey trots, 5Ks, and fun runs.</p>
            <Link to="/submit" className="btn-primary mt-4 inline-flex">Submit a race</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {races.map((e) => (
              <EventCard key={e.id} event={e} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
