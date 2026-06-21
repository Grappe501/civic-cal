import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { runPublicDiscoverySearch } from "../../lib/api-discovery-search";
import { PUBLIC_DISCOVERY_EXAMPLES } from "../../lib/ai/publicDiscoverySearch";
import type { CivicEvent } from "../../lib/types";
import type { PersonalityMode, PublicDiscoveryAnswer } from "../../lib/discovery/types";

interface Props {
  events: CivicEvent[];
  mode: PersonalityMode;
  onAnswer: (answer: PublicDiscoveryAnswer) => void;
}

export function DiscoveryHero({ events, mode, onAnswer }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const examples = PUBLIC_DISCOVERY_EXAMPLES[mode];

  async function submit(text?: string) {
    const q = (text ?? query).trim();
    if (!q) return;
    setQuery(q);
    setLoading(true);
    try {
      onAnswer(await runPublicDiscoverySearch(q, events, mode));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="discovery-hero">
      <div className="discovery-hero-glow" />
      <div className="relative">
        <p className="discovery-hero-kicker">
          <Sparkles className="h-4 w-4 inline mr-1" />
          Ask Arkansas Everywhere
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-4 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            className="discovery-hero-input flex-1"
            placeholder="Where should I take my family this weekend?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-primary discovery-hero-btn shrink-0">
            {loading ? "Exploring…" : "Explore"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {examples.slice(0, 4).map((ex) => (
            <button
              key={ex}
              type="button"
              className="discovery-example-chip"
              onClick={() => submit(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
