import { cn } from "../../lib/cn";
import { chipsForMode } from "../../lib/discovery/chips";
import type { DiscoveryChipId, PersonalityMode } from "../../lib/discovery/types";

interface Props {
  mode: PersonalityMode;
  activeChip?: DiscoveryChipId | null;
  onSelect: (chipId: DiscoveryChipId | null) => void;
}

export function DiscoveryChips({ mode, activeChip, onSelect }: Props) {
  const chips = chipsForMode(mode);

  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl font-semibold text-ark-pine">What are you looking for?</h2>
      <p className="text-sm text-muted mt-1">Tap a vibe — not a database filter.</p>
      <div className="discovery-chip-grid mt-4">
        {chips.map((chip) => {
          const active = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelect(active ? null : chip.id)}
              className={cn("discovery-chip", active && "discovery-chip-active")}
            >
              <span className="discovery-chip-emoji" aria-hidden>{chip.emoji}</span>
              <span className="discovery-chip-label">{chip.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
