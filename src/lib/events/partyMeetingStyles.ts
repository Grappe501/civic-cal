import type { CivicEvent } from "../types";
import {
  isDemocraticCountyPartyMeeting,
  isRepublicanCountyPartyMeeting,
} from "../calendar/calendarDisplayPriority";

export type PartyMeetingLabel = "Democratic county meeting" | "Republican county meeting" | "Libertarian meeting" | null;

export interface PartyMeetingPresentation {
  label: PartyMeetingLabel;
  /** Event pill / compact card */
  pillClassName: string;
  /** Full event card */
  cardClassName: string;
  /** Badge on detail / directory */
  badgeClassName: string;
}

function libertarianMeeting(event: CivicEvent): boolean {
  if (event.category !== "public_party_meeting") return false;
  const party = String(event.partyLabel ?? "").toLowerCase();
  if (party === "libertarian") return true;
  return /libertarian/i.test(event.title);
}

export function getPartyMeetingPresentation(event: CivicEvent): PartyMeetingPresentation | null {
  if (event.category !== "public_party_meeting") return null;

  if (isDemocraticCountyPartyMeeting(event)) {
    return {
      label: "Democratic county meeting",
      pillClassName: "bg-blue-950 border-blue-800 text-white hover:border-blue-600",
      cardClassName: "border-l-4 border-l-blue-800 bg-blue-50/80",
      badgeClassName: "bg-blue-900 text-white",
    };
  }

  if (isRepublicanCountyPartyMeeting(event)) {
    return {
      label: "Republican county meeting",
      pillClassName: "bg-red-950 border-red-800 text-white hover:border-red-600",
      cardClassName: "border-l-4 border-l-red-800 bg-red-50/80",
      badgeClassName: "bg-red-900 text-white",
    };
  }

  if (libertarianMeeting(event)) {
    return {
      label: "Libertarian meeting",
      pillClassName: "bg-amber-900 border-amber-700 text-white hover:border-amber-500",
      cardClassName: "border-l-4 border-l-amber-700 bg-amber-50/80",
      badgeClassName: "bg-amber-800 text-white",
    };
  }

  return null;
}

export function getPartyMeetingLabel(event: CivicEvent): PartyMeetingLabel {
  return getPartyMeetingPresentation(event)?.label ?? null;
}
