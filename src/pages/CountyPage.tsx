import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Share2 } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { fetchEvents } from "../lib/api";
import { countyFromSlug, countySlug, formatCountyLabel, ARKANSAS_COUNTIES } from "../lib/counties";
import type { CivicEvent } from "../lib/types";

export function CountyPage() {
  const { slug } = useParams<{ slug: string }>();
  const county = slug ? countyFromSlug(slug) : undefined;
  const [events, setEvents] = useState<CivicEvent[]>([]);

  useEffect(() => {
    if (!county) return;
    fetchEvents({ county }).then(setEvents).catch(console.error);
  }, [county]);

  if (!county) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p>County not found.</p>
        <Link to="/counties" className="btn-primary mt-4 inline-flex">All counties</Link>
      </div>
    );
  }

  async function shareCounty() {
    if (!county) return;
    const url = `${window.location.origin}/county/${countySlug(county)}`;
    if (navigator.share) await navigator.share({ title: `${formatCountyLabel(county)} calendar`, url });
    else {
      await navigator.clipboard.writeText(url);
      alert("County calendar link copied!");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-ark-sage font-medium uppercase tracking-wide">County calendar</p>
          <h1 className="font-display text-3xl font-bold text-ark-pine">{formatCountyLabel(county)}</h1>
          <p className="mt-2 text-ark-pine/70">
            Here&apos;s what&apos;s happening in {county} County this season.
          </p>
        </div>
        <button type="button" onClick={shareCounty} className="btn-secondary">
          <Share2 className="h-4 w-4" />
          Share this county calendar
        </button>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-ark-pine/70">No events listed yet for {county} County.</p>
          <Link to="/submit" className="btn-primary mt-4 inline-flex">Submit the first event</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CountiesIndexPage() {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchEvents({ limit: 500 })
      .then((events) => {
        const m = new Map<string, number>();
        for (const e of events) m.set(e.county, (m.get(e.county) ?? 0) + 1);
        setCounts(m);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ark-pine">All 75 counties</h1>
      <p className="mt-2 text-ark-pine/70 mb-8">Shareable county calendars for organizers and neighbors.</p>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {ARKANSAS_COUNTIES.map((county) => (
          <Link
            key={county}
            to={`/county/${countySlug(county)}`}
            className="card py-3 px-4 flex items-center justify-between hover:border-ark-sage"
          >
            <span className="font-medium text-ark-pine">{county}</span>
            <span className="text-xs text-ark-pine/50">{counts.get(county) ?? 0}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
