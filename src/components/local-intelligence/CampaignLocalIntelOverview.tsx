import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Brain, MapPin, Target } from "lucide-react";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import type { ClassifiedCampaignEvent } from "../../lib/campaigns/districtScope";
import {
  citySlug,
  listCityDossiers,
  listCountyDossiers,
  voteTargetGap,
} from "../../lib/local-intelligence/registry";
import { countySlug } from "../../lib/counties";
import { summarizeLocalIntelligence } from "../../lib/api-local-intelligence";
import { getCityDossier, getCountyDossier } from "../../lib/local-intelligence/registry";

interface Props {
  workspace: CampaignWorkspace;
  classified: ClassifiedCampaignEvent[];
  themePrimary: string;
  themeAccent: string;
}

export function CampaignLocalIntelOverview({ workspace, classified, themePrimary, themeAccent }: Props) {
  const [aiPlace, setAiPlace] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const cities = listCityDossiers(100);
  const counties = listCountyDossiers();

  const eventCities = useMemo(() => {
    const set = new Set<string>();
    classified.forEach((c) => {
      if (c.scored.event.city) set.add(c.scored.event.city.toLowerCase());
    });
    return set;
  }, [classified]);

  const topPriority = useMemo(() => [...cities].sort((a, b) => a.priorityRank - b.priorityRank).slice(0, 8), [cities]);

  const countiesNeedingAttention = useMemo(
    () =>
      [...counties]
        .map((c) => ({ county: c, gap: voteTargetGap(c) ?? 0 }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 6),
    [counties],
  );

  const highRdPlaces = useMemo(() => {
    const byCity = new Map<string, number>();
    classified.forEach((c) => {
      const city = c.scored.event.city;
      if (!city) return;
      const rd = c.scored.relationshipDensityScore;
      byCity.set(city, Math.max(byCity.get(city) ?? 0, rd));
    });
    return [...byCity.entries()]
      .filter(([, rd]) => rd >= 65)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [classified]);

  const emptyCities = useMemo(
    () => topPriority.filter((c) => !eventCities.has(c.city.toLowerCase())).slice(0, 6),
    [topPriority, eventCities],
  );

  const voteGaps = useMemo(
    () =>
      cities
        .map((c) => ({ city: c, gap: voteTargetGap(c) }))
        .filter((x) => x.gap != null && x.gap > 0)
        .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))
        .slice(0, 6),
    [cities],
  );

  async function askAbout(place: string, type: "city" | "county") {
    setAiPlace(place);
    setAiBusy(true);
    setAiText(null);
    try {
      const cityD = type === "city" ? getCityDossier(place) : undefined;
      const countyD = type === "county" ? getCountyDossier(place) : cityD ? getCountyDossier(cityD.county) : undefined;
      const events = classified.map((c) => c.scored.event).filter((e) =>
        type === "city" ? e.city?.toLowerCase() === place.toLowerCase() : e.county?.toLowerCase() === place.toLowerCase(),
      );
      const summary = await summarizeLocalIntelligence({
        workspace,
        cityDossier: cityD,
        countyDossier: countyD,
        events,
      });
      setAiText(summary.whyItMatters);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <section className="card card-elevated mb-8" style={{ borderTop: `4px solid ${themeAccent}` }}>
      <h2 className="font-display text-lg font-semibold flex items-center gap-2" style={{ color: themePrimary }}>
        <MapPin className="h-5 w-5" /> Local intelligence map
      </h2>
      <p className="text-xs text-muted mt-1">Candidate-only · aggregate geography · top 100 cities (expandable to 250)</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <div>
          <h3 className="text-sm font-semibold text-ark-pine">Top priority cities</h3>
          <ul className="mt-2 space-y-1.5">
            {topPriority.map((c) => (
              <li key={c.city} className="flex justify-between items-center text-sm">
                <Link to={`/campaigns/${workspace.slug}/city/${citySlug(c.city)}`} className="hover:underline" style={{ color: themeAccent }}>
                  #{c.priorityRank} {c.city}
                </Link>
                <button type="button" className="text-[10px] text-muted hover:text-ark-rust" onClick={() => askAbout(c.city, "city")}>
                  Ask AI
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ark-pine flex items-center gap-1">
            <Target className="h-4 w-4" /> Counties needing attention
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {countiesNeedingAttention.map(({ county, gap }) => (
              <li key={county.county} className="flex justify-between">
                <Link to={`/campaigns/${workspace.slug}/county/${countySlug(county.county)}`} className="hover:underline" style={{ color: themeAccent }}>
                  {county.county}
                </Link>
                <span className="text-muted text-xs">gap {gap.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ark-pine">High-RD event places</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {highRdPlaces.map(([city, rd]) => (
              <li key={city}>
                <Link to={`/campaigns/${workspace.slug}/city/${citySlug(city)}`} className="hover:underline" style={{ color: themeAccent }}>
                  {city}
                </Link>
                <span className="text-xs text-muted ml-1">RD {rd}</span>
              </li>
            ))}
            {highRdPlaces.length === 0 && <li className="text-xs text-muted">No high-RD clusters in current scope</li>}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ark-pine flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> No events indexed yet
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {emptyCities.map((c) => (
              <li key={c.city}>
                <Link to={`/campaigns/${workspace.slug}/city/${citySlug(c.city)}`} className="hover:underline" style={{ color: themeAccent }}>
                  {c.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ark-pine">Vote target gaps (city)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {voteGaps.map(({ city, gap }) => (
              <li key={city.city} className="flex justify-between">
                <span>{city.city}</span>
                <span className="font-medium">{gap?.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <button
            type="button"
            disabled={aiBusy}
            className="btn-primary text-sm w-full"
            onClick={() => askAbout(topPriority[0]?.city ?? "Little Rock", "city")}
          >
            <Brain className="h-4 w-4" /> Ask AI about top priority city
          </button>
          {aiPlace && (
            <p className="text-xs mt-3 text-ark-pine/80">
              <strong>{aiPlace}:</strong> {aiBusy ? "Analyzing…" : aiText ?? "—"}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
