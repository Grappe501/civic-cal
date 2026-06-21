import type { InstitutionTouchpoint } from "./institutionRelationshipTypes";

const PREFIX = "civic-cal-institution-touchpoints";

function key(slug: string): string {
  return `${PREFIX}:${slug}`;
}

export function loadTouchpoints(workspaceSlug: string): InstitutionTouchpoint[] {
  try {
    const raw = localStorage.getItem(key(workspaceSlug));
    if (raw) return JSON.parse(raw) as InstitutionTouchpoint[];
  } catch (_) {}
  return [];
}

export function saveTouchpoints(workspaceSlug: string, points: InstitutionTouchpoint[]): void {
  localStorage.setItem(key(workspaceSlug), JSON.stringify(points));
  window.dispatchEvent(new CustomEvent("civic-institution-touchpoints-updated"));
}

export function logInstitutionTouchpoint(
  workspaceSlug: string,
  touch: Omit<InstitutionTouchpoint, "id" | "workspaceSlug">,
): InstitutionTouchpoint {
  const record: InstitutionTouchpoint = {
    ...touch,
    id: `it-${Date.now()}`,
    workspaceSlug,
  };
  const all = loadTouchpoints(workspaceSlug);
  all.push(record);
  saveTouchpoints(workspaceSlug, all);
  return record;
}
