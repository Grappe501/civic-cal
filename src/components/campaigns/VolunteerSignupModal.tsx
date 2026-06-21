import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  campaignName: string;
  eventTitle: string;
  badgeLabel?: string;
}

export function VolunteerSignupModal({ open, onClose, campaignName, eventTitle, badgeLabel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-labelledby="volunteer-modal-title">
      <div className="card card-elevated max-w-md w-full relative">
        <button type="button" className="absolute top-3 right-3 text-ark-pine/50 hover:text-ark-pine" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <h2 id="volunteer-modal-title" className="font-display text-lg font-semibold text-ark-pine pr-8">
          Volunteer with {campaignName}
        </h2>
        <p className="text-sm text-muted mt-2">
          {badgeLabel ? `${badgeLabel} — ` : ""}
          <strong>{eventTitle}</strong>
        </p>
        <p className="text-sm text-ark-pine/85 mt-4">
          Signup link coming soon. Contact the campaign directly to volunteer at this event — the campaign will publish a Mobilize or signup URL when ready.
        </p>
        <button type="button" className="btn-primary mt-6 w-full" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
