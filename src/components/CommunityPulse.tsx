import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import { emptyCounties } from "../lib/api";
import { ARKANSAS_COUNTIES } from "../lib/counties";
import type { CivicEvent } from "../lib/types";

export function CommunityPulse({ events }: { events: CivicEvent[] }) {
  const byCounty = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const e of events) {
    byCounty.set(e.county, (byCounty.get(e.county) ?? 0) + 1);
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
  }

  const topCounties = [...byCounty.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const empty = emptyCounties(ARKANSAS_COUNTIES, events);

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="card md:col-span-2">
        <h2 className="font-display text-lg font-semibold text-ark-pine flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-ark-sage" />
          Community pulse
        </h2>
        <p className="mt-1 text-sm text-ark-pine/60">Where activity is showing up this season</p>
        <ul className="mt-4 space-y-2">
          {topCounties.map(([county, count]) => (
            <li key={county} className="flex items-center justify-between text-sm">
              <span>{county} County</span>
              <span className="font-semibold text-ark-rust">{count} events</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="font-display text-lg font-semibold text-ark-pine flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Empty county alerts
        </h2>
        <p className="mt-1 text-sm text-ark-pine/60">
          {empty.length} counties with no events yet — be a local champion.
        </p>
        <p className="mt-3 text-xs text-ark-pine/50 line-clamp-4">
          {empty.slice(0, 12).join(", ")}
          {empty.length > 12 ? "…" : ""}
        </p>
      </div>

      {events.some((e) => e.featured) && (
        <div className="card md:col-span-3 bg-gradient-to-br from-ark-wheat to-white">
          <h2 className="font-display text-lg font-semibold text-ark-pine flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ark-rust" />
            Event of the week
          </h2>
          <p className="mt-2 text-sm text-ark-pine/70">
            {events.find((e) => e.featured)?.title ?? events[0]?.title}
          </p>
        </div>
      )}
    </section>
  );
}
