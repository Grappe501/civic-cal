import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { getCityDossier, getCountyDossier, citySlug, voteTargetGap } from "../../lib/local-intelligence/registry";
import { countySlug } from "../../lib/counties";
import type { CivicEvent } from "../../lib/types";

interface Props {
  event: CivicEvent;
  campaignSlug: string;
  compact?: boolean;
}

export function LocalGeographyIntelStrip({ event, campaignSlug, compact }: Props) {
  const cityDossier = event.city ? getCityDossier(event.city) : undefined;
  const countyDossier = event.county ? getCountyDossier(event.county) : undefined;
  const countyGap = countyDossier ? voteTargetGap(countyDossier) : null;
  const traditions = cityDossier?.recurringEvents?.slice(0, 2) ?? countyDossier?.recurringTraditions?.slice(0, 2) ?? [];
  const confidence = cityDossier?.confidenceScore ?? countyDossier?.confidenceScore;

  if (!cityDossier && !countyDossier) return null;

  return (
    <div className={`${compact ? "mt-2" : "mt-3"} flex flex-wrap gap-1.5 items-center`}>
      {cityDossier && (
        <>
          <span className="chip chip-muted text-[10px]">Priority #{cityDossier.priorityRank}</span>
          <Link
            to={`/campaigns/${campaignSlug}/city/${citySlug(cityDossier.city)}`}
            className="chip text-[10px] bg-ark-sage/15 text-ark-pine hover:bg-ark-sage/25 inline-flex items-center gap-1"
          >
            <MapPin className="h-3 w-3" /> City intel
          </Link>
        </>
      )}
      {countyDossier && (
        <Link
          to={`/campaigns/${campaignSlug}/county/${countySlug(countyDossier.county)}`}
          className="chip text-[10px] bg-ark-sage/15 text-ark-pine hover:bg-ark-sage/25"
        >
          County intel
        </Link>
      )}
      {countyGap != null && (
        <span className="chip chip-muted text-[10px]">County vote gap {countyGap.toLocaleString()}</span>
      )}
      {traditions.map((t) => (
        <span key={t} className="chip chip-muted text-[10px] truncate max-w-[140px]" title={t}>
          {t}
        </span>
      ))}
      {confidence != null && (
        <span className="chip chip-muted text-[10px]">Local conf. {confidence}%</span>
      )}
    </div>
  );
}
