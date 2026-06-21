import type { LocalIntelligenceSummary } from "./local-intelligence/types";
import type { LocalIntelContext } from "./ai/localIntelligenceSummarizer";
import { deterministicLocalSummary } from "./ai/localIntelligenceSummarizer";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export async function summarizeLocalIntelligence(ctx: LocalIntelContext): Promise<LocalIntelligenceSummary> {
  try {
    const res = await fetch(`${fnBase}/local-intelligence-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: ctx }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.summary as LocalIntelligenceSummary;
    }
  } catch (_) {}
  return deterministicLocalSummary(ctx);
}
