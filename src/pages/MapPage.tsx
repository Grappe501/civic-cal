import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { List, Map, PlusCircle, CalendarDays } from "lucide-react";
import { ArkansasEventMap } from "../components/maps/ArkansasEventMap";
import { MapFilters, type MapFilterState } from "../components/maps/MapFilters";
import { fetchEvents } from "../lib/api";
import type { CivicEvent } from "../lib/types";
import { CivicGlyphLegend } from "../components/glyphs/CivicGlyph";
import { PresenceLegend } from "../components/campaigns/PresenceLegend";
import { eventHasMapPin } from "../lib/maps/mapTypes";

function applyMapFilters(events: CivicEvent[], filters: MapFilterState): CivicEvent[] {
  let list = [...events];
  if (filters.county) list = list.filter((e) => e.county.toLowerCase() === filters.county!.toLowerCase());
  if (filters.category) list = list.filter((e) => e.category === filters.category);
  if (filters.from) list = list.filter((e) => e.startAt >= new Date(filters.from!).toISOString());
  if (filters.to) {
    const end = new Date(filters.to!);
    end.setHours(23, 59, 59, 999);
    list = list.filter((e) => e.startAt <= end.toISOString());
  }
  return list;
}

export function MapPage() {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [filters, setFilters] = useState<MapFilterState>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents({ limit: 500 })
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => applyMapFilters(events, filters), [events, filters]);
  const mappable = filtered.filter(eventHasMapPin);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-kicker">Visual civic nervous system</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ark-pine">
            Arkansas lights up
          </h1>
          <p className="mt-2 text-muted max-w-xl">
            See festivals, city halls, school boards, and community gatherings across all 75 counties.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/submit" className="btn-primary">
            <PlusCircle className="h-4 w-4" />
            Submit an event near you
          </Link>
          <Link to="/calendar/dates" className="btn-secondary text-sm">
            <CalendarDays className="h-4 w-4" />
            State dates
          </Link>
          <Link to="/" className="btn-secondary">
            <List className="h-4 w-4" />
            View list instead
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <MapFilters
          filters={filters}
          onChange={setFilters}
          mappableCount={mappable.length}
          totalCount={filtered.length}
        />
        <div>
          {loading ? (
            <div className="h-[520px] animate-pulse rounded-2xl bg-ark-wheat/50" />
          ) : (
            <ArkansasEventMap events={filtered} height="min(70vh, 620px)" />
          )}
          <p className="mt-3 text-xs text-caption flex items-center gap-1">
            <Map className="h-3.5 w-3.5" />
            {mappable.length} mapped · {filtered.length - mappable.length} awaiting geocode or address
          </p>
          <PresenceLegend />
          <CivicGlyphLegend compact />
        </div>
      </div>
    </div>
  );
}
