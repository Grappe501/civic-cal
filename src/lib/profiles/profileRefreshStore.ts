import type { CommunityProfile } from "./profileTypes";

const STORAGE_KEY = "civic-profile-refresh-queue";

export type RefreshTaskStatus = "open" | "refreshed" | "research";

export interface ProfileRefreshTask {
  id: string;
  profileKey: string;
  slug: string;
  entityType: string;
  title: string;
  reason: string;
  status: RefreshTaskStatus;
  sourceUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function load(): ProfileRefreshTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfileRefreshTask[]) : [];
  } catch {
    return [];
  }
}

function save(tasks: ProfileRefreshTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function listRefreshTasks(): ProfileRefreshTask[] {
  return load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function enqueueProfileRefresh(profile: CommunityProfile, reason: string): ProfileRefreshTask {
  const tasks = load();
  const profileKey = `${profile.entityType}:${profile.slug}`;
  const existing = tasks.find((t) => t.profileKey === profileKey && t.status === "open");
  if (existing) return existing;

  const task: ProfileRefreshTask = {
    id: `pr-${Date.now()}`,
    profileKey,
    slug: profile.slug,
    entityType: profile.entityType,
    title: profile.title,
    reason,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.unshift(task);
  save(tasks);
  return task;
}

export function updateRefreshTask(id: string, patch: Partial<ProfileRefreshTask>): ProfileRefreshTask | null {
  const tasks = load();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  tasks[idx] = { ...tasks[idx], ...patch, updatedAt: new Date().toISOString() };
  save(tasks);
  return tasks[idx];
}

export function markRefreshed(id: string): void {
  updateRefreshTask(id, { status: "refreshed" });
}

export function sendToResearch(id: string, notes?: string): void {
  updateRefreshTask(id, { status: "research", notes });
}

export function attachSourceUrl(id: string, sourceUrl: string): void {
  updateRefreshTask(id, { sourceUrl });
}
