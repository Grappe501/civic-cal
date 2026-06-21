import type { AiBrainRequest, AiBrainResponse } from "./ai-brain/brainContext";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export async function askAiBrain(req: AiBrainRequest): Promise<AiBrainResponse> {
  const res = await fetch(`${fnBase}/ai-brain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `AI Brain ${res.status}`);
  }
  return res.json() as Promise<AiBrainResponse>;
}

export { getBrainIndexSnapshot, buildBrainContext } from "./ai-brain/brainContext";
export type { AiBrainRequest, AiBrainResponse } from "./ai-brain/brainContext";
