import type { CivicEvent } from "../../lib/types";
import type { IngestionCandidate } from "../../lib/intelligence/types";

interface Props {
  event?: CivicEvent;
  candidate?: IngestionCandidate;
}

export function PublicCivicMeetingBadge({ event, candidate }: Props) {
  const category = event?.category ?? candidate?.category;
  if (category !== "public_party_meeting" && category !== "civic_meeting") return null;

  const party = candidate?.partyLabel;
  const verified = (candidate?.confidenceScore ?? 0) >= 70;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded badge-info">Public civic meeting</span>
      {category === "public_party_meeting" && (
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-600 text-white">Party committee</span>
      )}
      {party && <span className="text-[10px] font-medium px-2 py-0.5 rounded chip-muted">{party} (public listing)</span>}
      {verified && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded badge-success">Source verified</span>}
    </div>
  );
}
