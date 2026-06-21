import type { PersonalityMode } from "./types";

const KEY = "civic-cal-personality-mode";

export function loadPersonalityMode(): PersonalityMode {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "citizen" || raw === "candidate" || raw === "organizer" || raw === "volunteer_seeker") return raw;
  } catch (_) {}
  return "citizen";
}

export function savePersonalityMode(mode: PersonalityMode): void {
  localStorage.setItem(KEY, mode);
  window.dispatchEvent(new CustomEvent("civic-personality-changed", { detail: mode }));
}

export const PERSONALITY_LABELS: Record<PersonalityMode, { label: string; subtitle: string }> = {
  citizen: { label: "I'm a citizen", subtitle: "Family, food, festivals, music, markets" },
  candidate: { label: "I'm a candidate", subtitle: "Crowds, relationship rooms, church meals, gov meetings" },
  organizer: { label: "I'm an organizer", subtitle: "Volunteer shifts, schools, community builds" },
  volunteer_seeker: { label: "I'm looking for volunteers", subtitle: "Events that need hands and hearts" },
};
