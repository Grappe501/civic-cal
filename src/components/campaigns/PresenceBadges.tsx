import type { EventPresence } from "../../lib/campaigns/presenceLayer";

interface Props {
  presence: EventPresence;
  className?: string;
}

const CORNER_CLASS: Record<string, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

export function PresenceBadges({ presence, className = "" }: Props) {
  if (!presence.publicBadges.length) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden={false}>
      {presence.publicBadges.map((badge, i) => (
        <span
          key={`${badge.corner}-${badge.slug}-${i}`}
          className={`absolute max-w-[45%] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${CORNER_CLASS[badge.corner]}`}
          style={{ backgroundColor: badge.color, color: badge.textColor || "#fff" }}
          title={badge.campaignName}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
