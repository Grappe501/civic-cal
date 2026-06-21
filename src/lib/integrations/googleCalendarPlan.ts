/**
 * Google Calendar integration — planning rail only.
 * No live OAuth in this pass. Explicit user action required before any calendar writes.
 */

export type GoogleCalendarConnectionStatus = "not_connected" | "pending_oauth" | "connected" | "error";

export interface GoogleCalendarPlanConfig {
  clientId?: string;
  redirectUri: string;
  scopes: string[];
}

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function getGoogleCalendarPlan(): GoogleCalendarPlanConfig {
  return {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirectUri: `${window.location.origin}/campaigns/demo/oauth/google/callback`,
    scopes: GOOGLE_CALENDAR_SCOPES,
  };
}

export const GOOGLE_CALENDAR_ROADMAP = {
  phase: "planning",
  requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  oauthFlow: [
    "Campaign workspace owner clicks Connect Google Calendar",
    "Redirect to Google OAuth consent (calendar.events scope)",
    "Store refresh token encrypted per workspace — never in browser localStorage",
    "User explicitly clicks Add to campaign calendar on each event",
    "Create event via Calendar API with campaign metadata only",
  ],
  safety: [
    "No automatic sync without user confirmation per event",
    "No writes from AI harvester or admin bulk actions",
    "Tokens scoped to single campaign workspace",
  ],
};

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}
