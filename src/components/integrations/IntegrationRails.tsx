import { Calendar, Users } from "lucide-react";
import { GOOGLE_CALENDAR_ROADMAP, isGoogleCalendarConfigured } from "../../lib/integrations/googleCalendarPlan";
import { MOBILIZE_ROADMAP, isMobilizeConfigured } from "../../lib/integrations/mobilizePlan";

export function GoogleCalendarRail() {
  const configured = isGoogleCalendarConfigured();
  return (
    <div className="card border border-dashed border-ark-pine/20">
      <div className="flex items-center gap-2 text-ark-pine">
        <Calendar className="h-5 w-5 text-ark-sage" />
        <h3 className="font-semibold">Google Calendar</h3>
        <span className="chip bg-ark-wheat text-xs">Coming soon</span>
      </div>
      <p className="text-sm text-ark-pine/60 mt-2">
        Connect a campaign calendar to add verified events — only when you explicitly approve each one.
      </p>
      <ul className="text-xs text-ark-pine/50 mt-2 list-disc pl-4 space-y-1">
        {GOOGLE_CALENDAR_ROADMAP.oauthFlow.slice(0, 3).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled className="btn-secondary opacity-50 cursor-not-allowed text-xs">
          Connect Google Calendar
        </button>
        <button type="button" disabled className="btn-secondary opacity-50 cursor-not-allowed text-xs">
          Add event to campaign calendar
        </button>
      </div>
      <p className="text-xs text-ark-pine/40 mt-2">
        Requires {GOOGLE_CALENDAR_ROADMAP.requiredEnv.join(", ")} — {configured ? "client ID present" : "not configured"}
      </p>
    </div>
  );
}

export function MobilizeRail() {
  return (
    <div className="card border border-dashed border-ark-pine/20">
      <div className="flex items-center gap-2 text-ark-pine">
        <Users className="h-5 w-5 text-ark-rust" />
        <h3 className="font-semibold">Mobilize</h3>
        <span className="chip bg-ark-wheat text-xs">Planned</span>
      </div>
      <p className="text-sm text-ark-pine/60 mt-2">
        Attach volunteer recruitment to events you plan to attend — explicit approval required before any Mobilize write.
      </p>
      <ul className="text-xs text-ark-pine/50 mt-2 list-disc pl-4 space-y-1">
        {MOBILIZE_ROADMAP.safety.slice(0, 2).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled className="btn-secondary opacity-50 cursor-not-allowed text-xs">
          Create Mobilize volunteer event
        </button>
        <button type="button" disabled className="btn-secondary opacity-50 cursor-not-allowed text-xs">
          Sync RSVPs
        </button>
      </div>
      <p className="text-xs text-ark-pine/40 mt-2">
        MOBILIZE_API_KEY server-side only — {isMobilizeConfigured() ? "configured" : "not configured"}
      </p>
    </div>
  );
}
