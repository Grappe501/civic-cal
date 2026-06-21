import { CATEGORIES } from "../../lib/categories";
import { CALENDAR_FILTER_CHIPS, type CalendarFilterState, toggleCalendarFilter } from "../../lib/calendar/calendarFilters";
import { ARKANSAS_COUNTIES } from "../../lib/counties";

interface Props {
  filters: CalendarFilterState;
  onChange: (next: CalendarFilterState) => void;
}

export function CalendarFilters({ filters, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CALENDAR_FILTER_CHIPS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={filters[id] ? "chip chip-active text-xs" : "chip chip-muted text-xs"}
            onClick={() => onChange(toggleCalendarFilter(filters, id))}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="input-readable text-xs max-w-[160px]"
          value={filters.county ?? ""}
          onChange={(e) => onChange({ ...filters, county: e.target.value || undefined })}
          aria-label="Filter by county"
        >
          <option value="">All counties</option>
          {ARKANSAS_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="input-readable text-xs max-w-[140px]"
          placeholder="City filter"
          value={filters.city ?? ""}
          onChange={(e) => onChange({ ...filters, city: e.target.value || undefined })}
        />
        <select
          className="input-readable text-xs max-w-[180px]"
          value={filters.category ?? ""}
          onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
          aria-label="Filter by category"
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
  );
}
