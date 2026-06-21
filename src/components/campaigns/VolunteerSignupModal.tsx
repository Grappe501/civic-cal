import { X, ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  campaignName: string;
  eventTitle: string;
  badgeLabel?: string;
  signupUrl?: string | null;
  campaignWebsiteUrl?: string | null;
}

export function VolunteerSignupModal({
  open,
  onClose,
  campaignName,
  eventTitle,
  badgeLabel,
  signupUrl,
  campaignWebsiteUrl,
}: Props) {
  if (!open) return null;

  const dest = signupUrl ?? campaignWebsiteUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-labelledby="volunteer-modal-title">
      <div className="card card-elevated max-w-md w-full relative">
        <button type="button" className="absolute top-3 right-3 text-caption hover:text-ark-pine" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <h2 id="volunteer-modal-title" className="font-display text-lg font-semibold text-ark-pine pr-8">
          Volunteer with {campaignName}
        </h2>
        <p className="text-sm text-muted mt-2">
          {badgeLabel ? `${badgeLabel} — ` : ""}
          <strong>{eventTitle}</strong>
        </p>
        {dest ? (
          <>
            <p className="text-sm text-muted mt-4">
              Sign up on the official campaign site — you&apos;ll leave Arkansas Everywhere.
            </p>
            <a
              href={dest}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6 w-full inline-flex items-center justify-center gap-2"
            >
              Continue to volunteer signup <ExternalLink className="h-4 w-4" />
            </a>
          </>
        ) : (
          <p className="text-sm text-muted mt-4">
            Signup link coming soon. Contact the campaign directly to volunteer at this event.
          </p>
        )}
        <button type="button" className="btn-secondary mt-3 w-full" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
