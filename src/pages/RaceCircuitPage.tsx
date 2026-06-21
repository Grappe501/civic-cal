import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EventCard } from "../components/EventCard";
import { RaceCircuitHeader } from "../components/discovery/RaceCircuitHeader";
import { fetchEvents } from "../lib/api";
import { filterRaces } from "../lib/discovery/eventDiscovery";
import type { RaceCategoryId } from "../lib/discovery/types";
import { listProfiles } from "../lib/profiles/profileRegistry";
import { profilePath } from "../lib/profiles/profileLinks";
import { staleLabel } from "../lib/freshness/staleData";

export function RaceCircuitPage() {
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchEvents>>>([]);
  const [category, setCategory] = useState<RaceCategoryId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents({ limit: 500 }).then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const races = useMemo(() => filterRaces(events, category ?? undefined), [events, category]);
  const allRaces = useMemo(() => filterRaces(events), [events]);
  const raceProfiles = useMemo(() => listProfiles("race").slice(0, 12), []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <RaceCircuitHeader activeCategory={category} onCategoryChange={setCategory} raceCount={allRaces.length} />

      {raceProfiles.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ark-pine mb-3">Race profiles</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {raceProfiles.map((p) => (
              <li key={p.slug}>
                <Link to={profilePath("race", p.slug)} className="card block py-3 hover:border-ark-sage">
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-[10px] text-muted mt-1">{p.city ? `${p.city} · ` : ""}{p.county} County</p>
                  <span className="text-[10px] badge-info mt-2 inline-block">{staleLabel(p.freshness)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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
