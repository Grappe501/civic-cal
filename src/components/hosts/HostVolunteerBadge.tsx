import { Link } from "react-router-dom";
import { HandHeart } from "lucide-react";
import { useState } from "react";
import type { CivicEvent } from "../../lib/types";
import { loadHostVolunteerSettings, saveHostVolunteerSettings } from "../../lib/hosts/hostStore";
import { VolunteerSignupModal } from "../campaigns/VolunteerSignupModal";

interface Props {
  event: CivicEvent;
}

/** General host volunteer layer — churches, festivals, schools, not campaign-specific */
export function HostVolunteerBadge({ event }: Props) {
  const settings = loadHostVolunteerSettings(event.id);
  const [modalOpen, setModalOpen] = useState(false);

  if (!settings?.volunteersNeeded || !settings.advertisePublicly) return null;

  const label =
    settings.volunteerNeededCount != null && settings.volunteerNeededCount > 0
      ? `Volunteers needed (${settings.volunteerNeededCount})`
      : "Volunteers needed";

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (settings?.volunteerSignupUrl) {
      window.open(settings.volunteerSignupUrl, "_blank", "noopener,noreferrer");
    } else {
      setModalOpen(true);
    }
  }

  return (
    <>
      <button
        type="button"
        className="host-volunteer-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-teal-700 text-white shadow-sm hover:brightness-110"
        aria-label={`Volunteer opportunity at ${event.title}`}
        onClick={handleClick}
      >
        <HandHeart className="h-3 w-3" aria-hidden />
        {label}
      </button>
      <VolunteerSignupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        campaignName={event.hostOrganization ?? "Event host"}
        eventTitle={event.title}
        badgeLabel={label}
      />
    </>
  );
}

export function HostVolunteerControls({ eventId }: { eventId: string }) {
  const [settings, setSettings] = useState(() =>
    loadHostVolunteerSettings(eventId) ?? {
      eventId,
      volunteersNeeded: false,
      advertisePublicly: false,
      updatedAt: new Date().toISOString(),
    },
  );

  function patch(partial: Partial<typeof settings>) {
    const next = { ...settings, ...partial, updatedAt: new Date().toISOString() };
    setSettings(next);
    saveHostVolunteerSettings(next);
  }

  return (
    <div className="space-y-2 border-t border-ark-pine/10 pt-3 mt-3">
      <p className="text-xs font-semibold text-ark-pine">Host volunteer recruitment</p>
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={settings.volunteersNeeded}
          onChange={(e) => patch({ volunteersNeeded: e.target.checked, advertisePublicly: e.target.checked ? settings.advertisePublicly : false })}
        />
        Volunteers needed at this event
      </label>
          {settings.volunteersNeeded && (
        <>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={settings.advertisePublicly}
              onChange={(e) => patch({ advertisePublicly: e.target.checked })}
            />
            Show on public calendar
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={settings.studentServiceEligible ?? false}
              onChange={(e) => patch({ studentServiceEligible: e.target.checked, verifiedEntity: e.target.checked ? settings.verifiedEntity : false })}
            />
            Eligible for student service (requires verified organization)
          </label>
          {settings.studentServiceEligible && (
            <>
              <input
                className="input text-xs py-1.5"
                type="number"
                min={0.5}
                max={75}
                step={0.5}
                placeholder="Estimated service hours"
                value={settings.estimatedServiceHours ?? ""}
                onChange={(e) => patch({ estimatedServiceHours: e.target.value ? Number(e.target.value) : null })}
              />
              <select
                className="input text-xs py-1.5"
                value={settings.serviceCategory ?? ""}
                onChange={(e) => patch({ serviceCategory: (e.target.value || null) as typeof settings.serviceCategory })}
              >
                <option value="">Service category</option>
                <option value="festival_volunteer">Festival volunteer</option>
                <option value="library">Library</option>
                <option value="food_pantry">Food pantry</option>
                <option value="vfd_fundraiser">VFD fundraiser</option>
                <option value="race_volunteer">Race volunteer</option>
                <option value="church_community_meal">Church / community meal</option>
                <option value="four_h_extension">4-H / Extension</option>
                <option value="cleanup">Cleanup</option>
                <option value="school_event">School event</option>
                <option value="civic_organization">Civic organization</option>
              </select>
            </>
          )}
          <input
            className="input text-xs py-1.5"
            type="url"
            placeholder="Volunteer signup URL"
            value={settings.volunteerSignupUrl ?? ""}
            onChange={(e) => patch({ volunteerSignupUrl: e.target.value || null })}
          />
          <input
            className="input text-xs py-1.5"
            type="number"
            min={1}
            placeholder="# volunteers needed"
            value={settings.volunteerNeededCount ?? ""}
            onChange={(e) => patch({ volunteerNeededCount: e.target.value ? Number(e.target.value) : null })}
          />
        </>
      )}
      <p className="text-[10px] text-muted">
        For churches, festivals, schools, VFDs — separate from campaign volunteer badges.{" "}
        <Link to="/host" className="underline">Host portal</Link>
      </p>
    </div>
  );
}
