import type { CivicEvent } from "../types";
import { isRepublicanCountyPartyMeeting } from "../calendar/calendarDisplayPriority";
import { launchFlags } from "../launch/launchFlags";

export function isRepublicanPartyMeetingPubliclyHidden(event: CivicEvent): boolean {
  if (launchFlags.showRepublicanPartyMeetings) return false;
  return isRepublicanCountyPartyMeeting(event);
}

export function filterRepublicanPartyMeetingsFromPublic(events: CivicEvent[]): CivicEvent[] {
  if (launchFlags.showRepublicanPartyMeetings) return events;
  return events.filter((e) => !isRepublicanCountyPartyMeeting(e));
}
