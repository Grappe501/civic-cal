/**
 * Mobilize integration — planning rail only.
 * No live Mobilize API writes in this pass.
 */

export type MobilizeConnectionStatus = "not_connected" | "pending" | "connected" | "error";

export const MOBILIZE_ROADMAP = {
  phase: "planning",
  requiredEnv: ["MOBILIZE_API_KEY"],
  workflow: [
    "Campaign workspace linked to Mobilize organization",
    "User reviews event in campaign dashboard",
    "Explicit click: Create Mobilize volunteer event",
    "Optional: attach volunteer recruitment goal from campaign_event_plans",
    "RSVP sync read-only until user approves two-way sync",
  ],
  safety: [
    "MOBILIZE_API_KEY stored server-side only — never VITE_ prefix",
    "No auto-create from AI assessments or harvester",
    "Workspace ownership verified before any Mobilize write",
    "User must confirm volunteer copy and time before publish",
  ],
};

export function isMobilizeConfigured(): boolean {
  return false;
}

export interface MobilizeEventDraft {
  title: string;
  startAt: string;
  location?: string;
  volunteerGoal?: number;
  campaignWorkspaceId: string;
}

/** Placeholder — returns disabled until MOBILIZE_API_KEY + OAuth ownership wired. */
export function planMobilizeCreate(_draft: MobilizeEventDraft): { allowed: false; reason: string } {
  return {
    allowed: false,
    reason: "Mobilize integration is planned — requires MOBILIZE_API_KEY and explicit user approval per event.",
  };
}
