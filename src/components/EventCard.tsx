import { Link } from "react-router-dom";
import { CalendarPlus, MapPin, Share2, Star } from "lucide-react";
import type { CivicEvent } from "../lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { PresenceBadges } from "./campaigns/PresenceBadges";
import { useEventPresence } from "../hooks/useEventPresence";
import { downloadIcs, formatEventRange, mapsUrl, shareEventUrl } from "../lib/format";
import { HostVolunteerBadge } from "./hosts/HostVolunteerBadge";
import { StudentServiceBadge } from "./student-service/StudentServiceBadge";
import { getEventStudentServiceOpportunity } from "../lib/student-service/studentServiceEngine";
import { CivicGlyph } from "./glyphs/CivicGlyph";
import { glyphForEventCategory } from "../lib/glyphs/civicGlyphs";
import { cn } from "../lib/cn";

export function EventCard({ event, compact }: { event: CivicEvent; compact?: boolean }) {
  const maps = mapsUrl(event);
  const presence = useEventPresence(event.id);
  const eventGlyph = glyphForEventCategory(event.category, event.title);
  const studentServiceOpp = getEventStudentServiceOpportunity(event);

  async function handleShare() {
    const url = shareEventUrl(event);
    if (navigator.share) {
      await navigator.share({ title: event.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <article className={cn("card flex flex-col gap-3 relative", event.featured && "ring-2 ring-ark-rust/30")}>
      <PresenceBadges presence={presence} eventTitle={event.title} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CivicGlyph glyph={eventGlyph} size="sm" />
            {event.featured && (
            <span className="chip bg-ark-rust/10 text-ark-rust text-[10px] uppercase tracking-wide">
              <Star className="inline h-3 w-3 mr-1" />
              Featured
            </span>
          )}
          </div>
          <Link to={`/event/${event.slug}`} className="font-display text-lg font-semibold text-ark-pine hover:text-ark-rust block">
            {event.title}
          </Link>
        </div>
        <CategoryBadge category={event.category} />
      </div>

      <p className="text-sm text-muted">{formatEventRange(event)}</p>

      <div className="flex flex-wrap gap-1.5">
        <HostVolunteerBadge event={event} />
        {studentServiceOpp && <StudentServiceBadge opportunity={studentServiceOpp} compact />}
      </div>

      <p className="text-sm flex items-start gap-1.5 text-muted">
        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-ark-sage" />
        <span>
          {[event.city, `${event.county} County`].filter(Boolean).join(" · ")}
          {event.locationName && !compact && (
            <span className="block text-muted-soft">{event.locationName}</span>
          )}
        </span>
      </p>

      {!compact && event.description && (
        <p className="text-sm text-muted line-clamp-2">{event.description}</p>
      )}

      {event.hostOrganization && (
        <p className="text-xs text-caption">Hosted by {event.hostOrganization}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-ark-pine/5">
        {maps && (
          <a href={maps} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3">
            Map
          </a>
        )}
        <button type="button" onClick={() => downloadIcs(event)} className="btn-secondary text-xs py-1.5 px-3">
          <CalendarPlus className="h-3.5 w-3.5" />
          Add to calendar
        </button>
        <button type="button" onClick={handleShare} className="btn-secondary text-xs py-1.5 px-3">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      </div>
    </article>
  );
}
