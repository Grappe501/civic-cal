import registryBundle from "../../../data/candidates/candidate-registry.json";
import type { CandidateRegistryEntry } from "./types";

export function listCandidates(): CandidateRegistryEntry[] {
  return (registryBundle as { candidates?: CandidateRegistryEntry[] }).candidates ?? [];
}

export function getCandidateBySlug(slug: string): CandidateRegistryEntry | undefined {
  return listCandidates().find((c) => c.slug === slug || c.dashboard_slug === slug);
}

export function candidateRegistrySummary() {
  return (registryBundle as { summary?: Record<string, unknown> }).summary ?? {};
}
