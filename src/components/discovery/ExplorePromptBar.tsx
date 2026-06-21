import { Link } from "react-router-dom";
import { Compass, Gem, MapPin, Users, Car } from "lucide-react";
import type { ExploreIntent } from "../../lib/discovery/types";
import { cn } from "../../lib/cn";

const PROMPTS: { id: ExploreIntent; label: string; icon: typeof MapPin; description: string }[] = [
  { id: "near_me", label: "What's happening near me?", icon: MapPin, description: "This week across Arkansas" },
  { id: "busiest_weekend", label: "Busiest places this weekend", icon: Users, description: "Where crowds gather" },
  { id: "hidden_gems", label: "Hidden gems", icon: Gem, description: "Off the beaten path" },
  { id: "worth_the_drive", label: "Worth the drive", icon: Car, description: "Flagship events statewide" },
  { id: "candidate_presence", label: "Who's showing up?", icon: Compass, description: "Campaign presence map" },
];

interface Props {
  active?: ExploreIntent | null;
  onSelect: (intent: ExploreIntent | null) => void;
  showPresenceToggle?: boolean;
  presenceOn?: boolean;
  onPresenceToggle?: (on: boolean) => void;
}

export function ExplorePromptBar({ active, onSelect, showPresenceToggle, presenceOn, onPresenceToggle }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(active === id ? null : id)}
            className={cn("explore-prompt-card", active === id && "explore-prompt-card-active")}
          >
            <Icon className="h-5 w-5 shrink-0 text-ark-sage" />
            <div className="text-left">
              <p className="font-semibold text-sm text-ark-pine">{label}</p>
              <p className="text-[10px] text-muted">{description}</p>
            </div>
          </button>
        ))}
      </div>
      {showPresenceToggle && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={presenceOn}
            onChange={(e) => onPresenceToggle?.(e.target.checked)}
            className="rounded border-ark-pine/30"
          />
          <span>Show candidate attendance on map</span>
          <Link to="/campaigns" className="text-xs text-ark-rust hover:underline ml-auto">Campaign dashboards →</Link>
        </label>
      )}
    </div>
  );
}
