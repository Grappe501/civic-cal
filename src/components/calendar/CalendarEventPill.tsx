import { Link } from "react-router-dom";
import { HandHeart, UserCheck } from "lucide-react";
import type { CivicEvent } from "../../lib/types";
import { categoryColor } from "../../lib/categories";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import { CALENDAR_TZ } from "../../lib/calendar/calendarUtils";
import { getEventPresence } from "../../lib/campaigns/presenceLayer";
import { getEventStudentServiceOpportunity } from "../../lib/student-service/studentServiceEngine";
import { isDemoSeedEvent } from "../../lib/events/seedCatalog";
import { isFairFestivalEvent } from "../../lib/events/festivalUtils";
import { getCalendarDisplayPinLabel } from "../../lib/calendar/calendarDisplayPriority";
import { getPartyMeetingPresentation } from "../../lib/events/partyMeetingStyles";
import { cn } from "../../lib/cn";

interface Props {
  event: CivicEvent;
  compact?: boolean;
  className?: string;
  /** Show Dem meeting / Fair / Festival pin on compact crowded cells */
  showDisplayPin?: boolean;
}

export function CalendarEventPill({ event, compact, className, showDisplayPin }: Props) {
  const presence = getEventPresence(event.id);
  const hasCandidate = presence.attendingCampaigns.length > 0 || presence.surrogatePlans.length > 0;
  const hasVolunteer = presence.volunteerNeeds.length > 0;
  const student = getEventStudentServiceOpportunity(event);
  const displayPin = showDisplayPin ? getCalendarDisplayPinLabel(event) : null;
  const partyStyle = getPartyMeetingPresentation(event);
  const time = event.allDay
    ? "All day"
    : formatInTimeZone(parseISO(event.startAt), event.timezone || CALENDAR_TZ, "h:mm a");

  return (
    <Link
      to={`/event/${event.slug}`}
      className={cn(
        "block rounded-lg border px-2 py-1 text-left transition hover:shadow-md",
        partyStyle?.pillClassName ?? cn(categoryColor(event.category), "border-[var(--border)] hover:border-ark-sage/50"),
        compact ? "text-[10px] leading-tight" : "text-xs",
        className,
      )}
      title={event.title}
    >
      <span className="font-semibold line-clamp-2">{event.title}</span>
      {!compact && <span className="block opacity-90 mt-0.5">{time}</span>}
      {(partyStyle || displayPin || hasCandidate || hasVolunteer || student || isDemoSeedEvent(event) || isFairFestivalEvent(event)) && (
        <span className="flex flex-wrap gap-0.5 mt-1">
          {partyStyle && (
            <span className={`inline-flex rounded px-1 text-[8px] font-semibold ${partyStyle.badgeClassName}`}>
              {partyStyle.label}
            </span>
          )}
          {!partyStyle && displayPin === "Dem meeting" && (
            <span className="inline-flex rounded bg-blue-900 text-white px-1 text-[8px] font-semibold" title="Democratic county party meeting">
              Dem meeting
            </span>
          )}
          {displayPin === "Fair" && (
            <span className="inline-flex rounded bg-amber-900 text-white px-1 text-[8px] font-semibold" title="County fair">
              Fair
            </span>
          )}
          {displayPin === "Festival" && (
            <span className="inline-flex rounded bg-emerald-900 text-white px-1 text-[8px] font-semibold" title="Festival">
              Festival
            </span>
          )}
          {!partyStyle && !displayPin && isFairFestivalEvent(event) && (
            <span className="inline-flex rounded bg-emerald-900 text-white px-1 text-[8px]" title="Fair or festival">
              fest
            </span>
          )}
          {isDemoSeedEvent(event) && (
            <span className="badge-warning text-[8px] py-0 px-1" title="Demo seed — not verified">
              demo
            </span>
          )}
          {hasCandidate && (
            <span className="inline-flex items-center gap-0.5 rounded bg-ark-pine/90 text-white px-1 text-[8px]">
              <UserCheck className="h-2 w-2" aria-hidden /> cand
            </span>
          )}
          {hasVolunteer && (
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-800 text-white px-1 text-[8px]">
              <HandHeart className="h-2 w-2" aria-hidden /> vol
            </span>
          )}
          {student && (
            <span className="inline-flex rounded bg-sky-800 text-white px-1 text-[8px]">svc</span>
          )}
        </span>
      )}
    </Link>
  );
}
