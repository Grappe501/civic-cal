import { Link } from "react-router-dom";
import { Map, Calendar } from "lucide-react";
import { RACE_CATEGORIES } from "../../lib/discovery/raceCategories";
import type { RaceCategoryId } from "../../lib/discovery/types";
import { cn } from "../../lib/cn";

interface Props {
  activeCategory?: RaceCategoryId | null;
  onCategoryChange: (id: RaceCategoryId | null) => void;
  raceCount: number;
}

export function RaceCircuitHeader({ activeCategory, onCategoryChange, raceCount }: Props) {
  return (
    <div>
      <p className="section-kicker">Arkansas Race Circuit</p>
      <h1 className="page-header mt-1">Run the Natural State</h1>
      <p className="text-muted mt-2 max-w-2xl">
        5Ks, turkey trots, trail runs, and charity races — high attendance, high community energy. Candidates and citizens both show up here.
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        <Link to="/map" className="btn-secondary text-sm"><Map className="h-4 w-4" /> Race map</Link>
        <span className="chip chip-muted"><Calendar className="h-3 w-3 inline mr-1" />{raceCount} races indexed</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-6">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={cn("chip", !activeCategory ? "bg-ark-pine text-white" : "bg-ark-wheat")}
        >
          All races
        </button>
        {RACE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategoryChange(activeCategory === c.id ? null : c.id)}
            className={cn("chip text-xs", activeCategory === c.id ? "bg-ark-pine text-white" : "bg-ark-wheat")}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
