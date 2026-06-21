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
import { cn } from "../../lib/cn";

interface Props {
  event: CivicEvent;
  compact?: boolean;
  className?: string;
}

export function CalendarEventPill({ event, compact, className }: Props) {
  const presence = getEventPresence(event.id);
  const hasCandidate = presence.attendingCampaigns.length > 0 || presence.surrogatePlans.length > 0;
  const hasVolunteer = presence.volunteerNeeds.length > 0;
  const student = getEventStudentServiceOpportunity(event);
  const time = event.allDay
    ? "All day"
    : formatInTimeZone(parseISO(event.startAt), event.timezone || CALENDAR_TZ, "h:mm a");

  return (
    <Link
      to={`/event/${event.slug}`}
      className={cn(
        "block rounded-lg border border-[var(--border)] px-2 py-1 text-left transition hover:shadow-md hover:border-ark-sage/50",
        categoryColor(event.category),
        compact ? "text-[10px] leading-tight" : "text-xs",
        className,
      )}
      title={event.title}
    >
      <span className="font-semibold line-clamp-2">{event.title}</span>
      {!compact && <span className="block opacity-90 mt-0.5">{time}</span>}
      {(hasCandidate || hasVolunteer || student || isDemoSeedEvent(event)) && (
        <span className="flex flex-wrap gap-0.5 mt-1">
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
