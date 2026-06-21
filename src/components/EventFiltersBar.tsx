import { Search } from "lucide-react";
import { CATEGORIES } from "../lib/categories";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import type { EventFilters } from "../lib/types";

interface Props {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
}

export function EventFiltersBar({ filters, onChange }: Props) {
  function set<K extends keyof EventFilters>(key: K, value: EventFilters[K]) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="card space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ark-pine/40" />
        <input
          type="search"
          placeholder="Search events, places, organizations…"
          className="input pl-10"
          value={filters.q ?? ""}
          onChange={(e) => set("q", e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">County</label>
          <select
            className="input"
            value={filters.county ?? ""}
            onChange={(e) => set("county", e.target.value)}
          >
            <option value="">All counties</option>
            {ARKANSAS_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">City</label>
          <input
            className="input"
            placeholder="Any city"
            value={filters.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={filters.category ?? ""}
            onChange={(e) => set("category", e.target.value as EventFilters["category"])}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "thisWeekend" as const, label: "This weekend" },
          { key: "civicOnly" as const, label: "Civic meetings" },
          { key: "familyFriendly" as const, label: "Family friendly" },
          { key: "freeOnly" as const, label: "Free events" },
          { key: "candidateRelevant" as const, label: "Candidate relevant" },
          { key: "featured" as const, label: "Featured" },
        ].map(({ key, label }) => {
          const active = Boolean(filters[key]);
          return (
            <button
              key={key}
              type="button"
              onClick={() => set(key, active ? undefined : true)}
              className={
                active
                  ? "chip bg-ark-pine text-white"
                  : "chip bg-ark-wheat text-ark-pine border border-ark-pine/10"
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
