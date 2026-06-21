import healthBundle from "../../../data/autogrow/autogrow-health.json";
import runsBundle from "../../../data/autogrow/autogrow-runs.json";
import configBundle from "../../../data/autogrow/autogrow-config.json";

export interface AutogrowHealth {
  generatedAt: string;
  lastDailyScan: string | null;
  lastWeeklyDiscovery: string | null;
  lastProfileRefresh: string | null;
  lastCandidateBriefings: string | null;
  feedsScanned: number;
  newCandidatesFound: number;
  duplicatesSkipped: number;
  staleSources: number;
  failedSources: number;
  coverageGained: number;
  approvalQueueSize: number;
  candidateBriefingsGenerated: number;
  status: string;
  nextScheduled: Record<string, string>;
}

export function loadAutogrowHealth(): AutogrowHealth {
  return healthBundle as AutogrowHealth;
}

export function loadAutogrowRuns() {
  return runsBundle as { runs: { task: string; at: string; [key: string]: unknown }[]; lastRun: unknown };
}

export function loadAutogrowConfig() {
  return configBundle as {
    schedules: Record<string, { cron: string; label: string }>;
    policy: string;
    statewideAttachmentGoal?: number;
  };
}
