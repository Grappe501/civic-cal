import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import { ArkansasEventMap } from "./ArkansasEventMap";
import { MAP_DISCOVERY_CATEGORIES, inferMapDiscoveryCategory, type MapDiscoveryCategory } from "../../lib/maps/mapDiscoveryCategories";
import type { CivicEvent } from "../../lib/types";
import { getEventStudentServiceOpportunity } from "../../lib/student-service/studentServiceEngine";
import { getEventPresence } from "../../lib/campaigns/presenceLayer";

export interface DiscoveryMapFilters {
  category?: MapDiscoveryCategory;
  month?: string;
  county?: string;
  city?: string;
  volunteerOnly?: boolean;
  studentServiceOnly?: boolean;
  candidatePresenceOnly?: boolean;
}

interface Props {
  events: CivicEvent[];
}

export function HomeDiscoveryMap({ events }: Props) {
  const [filters, setFilters] = useState<DiscoveryMapFilters>({});
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...events];
    if (filters.category) list = list.filter((e) => inferMapDiscoveryCategory(e) === filters.category);
    if (filters.county) list = list.filter((e) => e.county.toLowerCase() === filters.county!.toLowerCase());
    if (filters.city) list = list.filter((e) => (e.city ?? "").toLowerCase().includes(filters.city!.toLowerCase()));
    if (filters.month) list = list.filter((e) => e.startAt.startsWith(filters.month!));
    if (filters.volunteerOnly) list = list.filter((e) => e.category === "volunteer" || /volunteer/i.test(e.title));
    if (filters.studentServiceOnly) list = list.filter((e) => Boolean(getEventStudentServiceOpportunity(e)));
    if (filters.candidatePresenceOnly) {
      list = list.filter((e) => getEventPresence(e.id).attendingCampaigns.length > 0);
    }
    return list;
  }, [events, filters]);

  const months = useMemo(() => {
    const set = new Set(events.map((e) => e.startAt.slice(0, 7)));
    return [...set].sort();
  }, [events]);

  return (
    <section className="card-readable overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-kicker flex items-center gap-2">
            <MapIcon className="h-4 w-4" /> Arkansas event map
          </p>
          <h2 className="font-display text-xl font-semibold">Every event we&apos;ve found</h2>
          <p className="text-sm text-muted mt-1">{filtered.length} events · pins use geocode or county centroid</p>
        </div>
        <Link to="/map" className="btn-secondary text-sm">
          Full-screen map
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {MAP_DISCOVERY_CATEGORIES.slice(0, 12).map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip text-[10px] ${filters.category === c.id ? "chip-active" : "chip-muted"}`}
            style={filters.category === c.id ? { backgroundColor: c.color, color: "#fff" } : undefined}
            onClick={() => setFilters((f) => ({ ...f, category: f.category === c.id ? undefined : c.id }))}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <select
          className="input-readable text-sm"
          value={filters.month ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value || undefined }))}
        >
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="input-readable text-sm"
          placeholder="County filter"
          value={filters.county ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, county: e.target.value || undefined }))}
        />
        <input
          type="text"
          className="input-readable text-sm"
          placeholder="City filter"
          value={filters.city ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value || undefined }))}
        />
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={Boolean(filters.volunteerOnly)}
            onChange={(e) => setFilters((f) => ({ ...f, volunteerOnly: e.target.checked || undefined }))}
          />
          Volunteer
        </label>
      </div>

      <ArkansasEventMap
        events={filtered}
        height="min(55vh, 480px)"
        selectedSlug={selectedSlug}
        onSelectEvent={(ev) => setSelectedSlug(ev?.slug ?? null)}
        useCentroidFallback
      />
    </section>
  );
}
