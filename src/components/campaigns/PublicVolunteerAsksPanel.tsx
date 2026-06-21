import { Link } from "react-router-dom";
import { HandHeart, ExternalLink } from "lucide-react";
import { resolveCampaignColors } from "../../lib/campaigns/brandingProfile";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import type { PublicVolunteerAsk } from "../../lib/campaigns/volunteerRecruitment";

interface Props {
  workspace: CampaignWorkspace;
  asks: PublicVolunteerAsk[];
  themePrimary: string;
}

export function PublicVolunteerAsksPanel({ workspace, asks, themePrimary }: Props) {
  if (asks.length === 0) {
    return (
      <div className="card card-elevated">
        <h3 className="font-display font-semibold text-sm" style={{ color: themePrimary }}>
          Public volunteer asks
        </h3>
        <p className="text-xs text-muted mt-2">
          No events advertising volunteers yet. Mark “Need volunteers” + “Advertise publicly” on any planned event.
        </p>
      </div>
    );
  }

  return (
    <div className="card card-elevated">
      <h3 className="font-display font-semibold flex items-center gap-2" style={{ color: themePrimary }}>
        <HandHeart className="h-4 w-4" /> Public volunteer asks ({asks.length})
      </h3>
      <p className="text-xs text-muted mt-1">Live on the public calendar — recruitment surface for supporters</p>
      <ul className="mt-3 space-y-2 max-h-56 overflow-y-auto">
        {asks.map((ask) => (
          <li key={ask.eventId} className="text-sm border-b border-ark-pine/5 pb-2">
            <div className="flex justify-between gap-2 items-start">
              <div>
                {ask.eventSlug ? (
                  <Link to={`/event/${ask.eventSlug}`} className="font-medium hover:underline text-ark-pine">
                    {ask.eventTitle ?? ask.eventId}
                  </Link>
                ) : (
                  <span className="font-medium">{ask.eventTitle ?? ask.eventId}</span>
                )}
                <p className="text-[10px] text-muted mt-0.5">{ask.badgeLabel}</p>
              </div>
              {ask.hasDestination ? (
                <a
                  href={ask.destinationUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip text-[9px] shrink-0"
                  style={{
                    backgroundColor: workspace.volunteerBrandColor ?? workspace.dashboardTheme.accentColor,
                    color: resolveCampaignColors(workspace).textOnVolunteer,
                  }}
                >
                  <ExternalLink className="h-3 w-3 inline mr-0.5" />
                  Sign up
                </a>
              ) : (
                <span className="chip chip-muted text-[9px] shrink-0">Link pending</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
