import { useState } from "react";
import { HandHeart, UserCheck, Users, Eye } from "lucide-react";
import type { EventPresence, PublicPresenceBadge } from "../../lib/campaigns/presenceLayer";
import { getWorkspaceBySlug } from "../../lib/campaigns/workspaces";
import { VolunteerSignupModal } from "./VolunteerSignupModal";

interface Props {
  presence: EventPresence;
  eventTitle: string;
  className?: string;
  variant?: "overlay" | "inline";
}

const CORNER_CLASS: Record<string, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

const BADGE_ICONS: Record<PublicPresenceBadge["kind"], typeof UserCheck> = {
  candidate: UserCheck,
  volunteer: HandHeart,
  surrogate: Users,
  watching: Eye,
};

function BadgeButton({
  badge,
  eventTitle,
  onVolunteerClick,
}: {
  badge: PublicPresenceBadge;
  eventTitle: string;
  onVolunteerClick: (badge: PublicPresenceBadge) => void;
}) {
  const Icon = BADGE_ICONS[badge.kind];
  const isVolunteer = badge.kind === "volunteer";
  const ariaLabel =
    badge.kind === "volunteer"
      ? `Volunteer opportunity for ${badge.campaignName} at ${eventTitle}`
      : `${badge.label} — ${badge.campaignName}`;

  function handleClick(e: React.MouseEvent) {
    if (!isVolunteer) return;
    e.preventDefault();
    e.stopPropagation();
    if (badge.destinationUrl) {
      window.open(badge.destinationUrl, "_blank", "noopener,noreferrer");
      return;
    }
    onVolunteerClick(badge);
  }

  const className = isVolunteer
    ? "presence-badge presence-badge-volunteer pointer-events-auto cursor-pointer hover:brightness-110 focus:outline focus:outline-2 focus:outline-offset-1"
    : "presence-badge pointer-events-none";

  return (
    <button
      type="button"
      className={className}
      style={{
        backgroundColor: badge.color,
        color: badge.textColor || "#fff",
        outlineColor: badge.color,
      }}
      title={badge.campaignName}
      aria-label={ariaLabel}
      onClick={handleClick}
      disabled={!isVolunteer}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{badge.label}</span>
    </button>
  );
}

export function PresenceBadges({ presence, eventTitle, className = "", variant = "overlay" }: Props) {
  const [modalBadge, setModalBadge] = useState<PublicPresenceBadge | null>(null);
  const modalWorkspace = modalBadge ? getWorkspaceBySlug(modalBadge.slug) : null;

  if (!presence.publicBadges.length) return null;

  const volunteerBadges = presence.publicBadges.filter((b) => b.kind === "volunteer");
  const otherBadges = presence.publicBadges.filter((b) => b.kind !== "volunteer");

  if (variant === "inline") {
    return (
      <>
        <div className={`flex flex-wrap gap-1.5 ${className}`}>
          {presence.publicBadges.map((badge, i) => (
            <span key={`${badge.kind}-${badge.slug}-${i}`} className="inline-flex">
              <BadgeButton badge={badge} eventTitle={eventTitle} onVolunteerClick={setModalBadge} />
            </span>
          ))}
        </div>
        <VolunteerSignupModal
          open={modalBadge != null}
          onClose={() => setModalBadge(null)}
          campaignName={modalBadge?.campaignName ?? ""}
          eventTitle={eventTitle}
          badgeLabel={modalBadge?.label}
          signupUrl={modalBadge?.destinationUrl ?? modalWorkspace?.defaultVolunteerSignupUrl}
          campaignWebsiteUrl={modalWorkspace?.campaignWebsiteUrl}
        />
      </>
    );
  }

  return (
    <>
      <div className={`absolute inset-0 z-10 ${className}`} aria-hidden={false}>
        {otherBadges.map((badge, i) => (
          <span
            key={`${badge.corner}-${badge.slug}-${i}`}
            className={`presence-badge absolute max-w-[48%] ${CORNER_CLASS[badge.corner]}`}
            style={{ backgroundColor: badge.color, color: badge.textColor || "#fff" }}
            title={badge.campaignName}
          >
            {(() => {
              const Icon = BADGE_ICONS[badge.kind];
              return <Icon className="h-3 w-3 shrink-0" aria-hidden />;
            })()}
            <span className="truncate">{badge.label}</span>
          </span>
        ))}
        {volunteerBadges.map((badge, i) => (
          <span key={`vol-${badge.slug}-${i}`} className={`absolute max-w-[48%] ${CORNER_CLASS[badge.corner]}`}>
            <BadgeButton badge={badge} eventTitle={eventTitle} onVolunteerClick={setModalBadge} />
          </span>
        ))}
      </div>
      <VolunteerSignupModal
        open={modalBadge != null}
        onClose={() => setModalBadge(null)}
        campaignName={modalBadge?.campaignName ?? ""}
        eventTitle={eventTitle}
        badgeLabel={modalBadge?.label}
        signupUrl={modalBadge?.destinationUrl ?? modalWorkspace?.defaultVolunteerSignupUrl}
        campaignWebsiteUrl={modalWorkspace?.campaignWebsiteUrl}
      />
    </>
  );
}
