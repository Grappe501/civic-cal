import type { IntelligenceLayer } from "../../lib/intelligence/eventLayers";

interface Props {
  layer: IntelligenceLayer;
  compact?: boolean;
}

const LABELS: Record<IntelligenceLayer, string> = {
  government: "L1 Gov",
  community_identity: "L2 Community",
  community_church: "L3 Church",
  school_ecosystem: "L4 School",
  relationship: "L5 Relationships",
};

const COLORS: Record<IntelligenceLayer, string> = {
  government: "bg-ark-pine text-white",
  community_identity: "bg-ark-sage text-white",
  community_church: "bg-ark-clay text-white",
  school_ecosystem: "bg-ark-sky text-ark-night",
  relationship: "bg-ark-rust text-white",
};

export function LayerBadge({ layer, compact }: Props) {
  return (
    <span className={`chip text-[10px] uppercase tracking-wide ${COLORS[layer]}`}>
      {compact ? LABELS[layer] : LABELS[layer].replace(/^L\d /, "Layer ")}
    </span>
  );
}

export function DensityBadge({ score }: { score: number }) {
  const tone =
    score >= 85 ? "bg-ark-rust/15 text-ark-rust" : score >= 70 ? "bg-amber-100 text-amber-900" : "bg-ark-wheat text-ark-pine";
  return (
    <span className={`chip text-[10px] ${tone}`} title="Relationship density — influence per attendee">
      RD {score}
    </span>
  );
}
