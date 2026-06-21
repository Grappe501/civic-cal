import type { CampaignLocalNote, CampaignVoteTarget } from "./types";

const NOTES_PREFIX = "civic-cal-campaign-local-notes";
const TARGETS_PREFIX = "civic-cal-campaign-vote-targets";

export function loadCampaignNotes(slug: string): CampaignLocalNote[] {
  try {
    const raw = localStorage.getItem(`${NOTES_PREFIX}:${slug}`);
    if (raw) return JSON.parse(raw) as CampaignLocalNote[];
  } catch (_) {}
  return [];
}

export function saveCampaignNote(slug: string, note: Omit<CampaignLocalNote, "id" | "createdAt" | "workspaceSlug">): CampaignLocalNote {
  const all = loadCampaignNotes(slug);
  const entry: CampaignLocalNote = {
    ...note,
    id: `note-${Date.now()}`,
    workspaceSlug: slug,
    createdAt: new Date().toISOString(),
    visibility: note.visibility || "private",
  };
  all.unshift(entry);
  localStorage.setItem(`${NOTES_PREFIX}:${slug}`, JSON.stringify(all.slice(0, 200)));
  return entry;
}

export function notesForCity(slug: string, city: string): CampaignLocalNote[] {
  return loadCampaignNotes(slug).filter((n) => n.city?.toLowerCase() === city.toLowerCase());
}

export function notesForCounty(slug: string, county: string): CampaignLocalNote[] {
  const norm = county.replace(/\s+County$/i, "").toLowerCase();
  return loadCampaignNotes(slug).filter((n) => n.county?.replace(/\s+County$/i, "").toLowerCase() === norm);
}

export function loadVoteTargets(slug: string): CampaignVoteTarget[] {
  try {
    const raw = localStorage.getItem(`${TARGETS_PREFIX}:${slug}`);
    if (raw) return JSON.parse(raw) as CampaignVoteTarget[];
  } catch (_) {}
  return [];
}

export function saveVoteTarget(slug: string, target: CampaignVoteTarget): void {
  const all = loadVoteTargets(slug).filter(
    (t) => !(t.geographyType === target.geographyType && t.geographyName === target.geographyName),
  );
  all.push({ ...target, workspaceSlug: slug, voteGap: (target.targetVotes ?? 0) - (target.baselineVotes ?? 0) });
  localStorage.setItem(`${TARGETS_PREFIX}:${slug}`, JSON.stringify(all));
}
