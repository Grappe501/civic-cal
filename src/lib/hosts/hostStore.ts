import type { HostEventVolunteerSettings, HostProfile } from "./hostTypes";

const HOST_KEY = "civic-cal-host-profile";
const VOL_PREFIX = "civic-cal-host-volunteers";

export function loadHostProfile(): HostProfile | null {
  try {
    const raw = localStorage.getItem(HOST_KEY);
    if (raw) return JSON.parse(raw) as HostProfile;
  } catch (_) {}
  return null;
}

export function saveHostProfile(profile: HostProfile): void {
  localStorage.setItem(HOST_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("civic-host-updated"));
}

export function clearHostProfile(): void {
  localStorage.removeItem(HOST_KEY);
  window.dispatchEvent(new CustomEvent("civic-host-updated"));
}

function volKey(eventId: string): string {
  return `${VOL_PREFIX}:${eventId}`;
}

export function loadHostVolunteerSettings(eventId: string): HostEventVolunteerSettings | null {
  try {
    const raw = localStorage.getItem(volKey(eventId));
    if (raw) return JSON.parse(raw) as HostEventVolunteerSettings;
  } catch (_) {}
  return null;
}

export function saveHostVolunteerSettings(settings: HostEventVolunteerSettings): void {
  localStorage.setItem(volKey(settings.eventId), JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("civic-host-volunteers-updated"));
}

export function eventHasHostVolunteerAsk(eventId: string): boolean {
  const s = loadHostVolunteerSettings(eventId);
  return Boolean(s?.volunteersNeeded && s.advertisePublicly);
}

export function listPublicHostVolunteerEventIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(VOL_PREFIX + ":")) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const s = JSON.parse(raw) as HostEventVolunteerSettings;
      if (s.volunteersNeeded && s.advertisePublicly) ids.push(s.eventId);
    } catch (_) {}
  }
  return ids;
}
