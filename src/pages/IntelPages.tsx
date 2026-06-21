import { useEffect, useState } from "react";
import { EventCard } from "../components/EventCard";
import { fetchEvents } from "../lib/api";
import type { CivicEvent } from "../lib/types";

export function ThisWeekPage() {
  const [events, setEvents] = useState<CivicEvent[]>([]);

  useEffect(() => {
    fetchEvents({ limit: 200 })
      .then((all) => {
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        setEvents(
          all.filter((e) => {
            const start = new Date(e.startAt);
            return start >= now && start <= weekEnd;
          }),
        );
      })
      .catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ark-pine">This Week in Arkansas</h1>
      <p className="mt-2 text-ark-pine/70 mb-8">
        County event briefs for candidates, volunteers, and community leaders.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
      {events.length === 0 && (
        <p className="text-ark-pine/60">No events in the next 7 days — check back or submit one.</p>
      )}
    </div>
  );
}

export function CivicWatchPage() {
  const [events, setEvents] = useState<CivicEvent[]>([]);

  useEffect(() => {
    fetchEvents({ civicOnly: true, limit: 200 }).then(setEvents).catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ark-pine">School Board & City Hall Watchlist</h1>
      <p className="mt-2 text-ark-pine/70 mb-8">Civic meetings and public government sessions across Arkansas.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}
