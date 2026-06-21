import type { EventCategory } from "../../lib/types";
import { CATEGORIES } from "../../lib/categories";
import { ARKANSAS_COUNTIES } from "../../lib/counties";

export interface MapFilterState {
  county?: string;
  category?: EventCategory;
  from?: string;
  to?: string;
}

interface Props {
  filters: MapFilterState;
  onChange: (f: MapFilterState) => void;
  mappableCount: number;
  totalCount: number;
}

export function MapFilters({ filters, onChange, mappableCount, totalCount }: Props) {
  function set<K extends keyof MapFilterState>(key: K, value: MapFilterState[K]) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-ark-pine/10 bg-white/95 p-4 shadow-sm backdrop-blur">
      <div>
        <p className="text-kicker">Explore Arkansas</p>
        <p className="font-display text-lg font-semibold text-ark-pine">
          {mappableCount} on map
          <span className="text-sm font-normal text-caption"> / {totalCount} events</span>
        </p>
      </div>

      <div>
        <label className="label">County</label>
        <select className="input" value={filters.county ?? ""} onChange={(e) => set("county", e.target.value)}>
          <option value="">All counties</option>
          {ARKANSAS_COUNTIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Category</label>
        <select
          className="input"
          value={filters.category ?? ""}
          onChange={(e) => set("category", e.target.value as EventCategory)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={filters.from ?? ""} onChange={(e) => set("from", e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={filters.to ?? ""} onChange={(e) => set("to", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
