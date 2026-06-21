import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import type { CivicEvent } from "../../lib/types";
import { CategoryBadge } from "../CategoryBadge";
import { PresenceBadges } from "../campaigns/PresenceBadges";
import { useEventPresence } from "../../hooks/useEventPresence";
import { formatEventRange } from "../../lib/format";
import { cn } from "../../lib/cn";

interface Props {
  event: CivicEvent;
  onClose?: () => void;
  className?: string;
}

export function EventMapCard({ event, onClose, className }: Props) {
  const presence = useEventPresence(event.id);

  return (
    <div className={cn("relative rounded-xl border border-ark-pine/15 bg-white p-4 shadow-lg", className)}>
      <PresenceBadges presence={presence} />
      <div className="flex items-start justify-between gap-2">
        <CategoryBadge category={event.category} />
        {onClose && (
          <button type="button" onClick={onClose} className="text-ark-pine/50 hover:text-ark-pine text-sm">
            ✕
          </button>
        )}
      </div>
      <h3 className="mt-2 font-display font-semibold text-ark-pine leading-snug">{event.title}</h3>
      <p className="mt-1 text-xs text-ark-pine/60 flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" />
        {formatEventRange(event)}
      </p>
      <p className="mt-1 text-xs text-ark-pine/70 flex items-start gap-1">
        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        {[event.city, `${event.county} County`].filter(Boolean).join(" · ")}
      </p>
      <Link to={`/event/${event.slug}`} className="btn-primary mt-3 w-full text-xs py-2">
        View event details
      </Link>
    </div>
  );
}
