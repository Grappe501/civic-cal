import { Link } from "react-router-dom";
import { pickReadableText } from "../../lib/contrast";
import { CIVIC_GLYPHS, type CivicGlyphDef } from "../../lib/glyphs/civicGlyphs";
import { cn } from "../../lib/cn";

interface Props {
  glyph: CivicGlyphDef;
  size?: "sm" | "md" | "lg";
  className?: string;
  asLink?: boolean;
  href?: string;
  title?: string;
}

const SIZE = { sm: "h-6 w-6 text-sm", md: "h-8 w-8 text-base", lg: "h-10 w-10 text-lg" };

export function CivicGlyph({ glyph, size = "md", className, asLink, href, title }: Props) {
  const inner = (
    <span
      className={cn(
        "civic-glyph inline-flex items-center justify-center rounded-full font-semibold shadow-sm border border-white/30",
        SIZE[size],
        className,
      )}
      style={{ backgroundColor: glyph.color, color: pickReadableText(glyph.color) }}
      title={title ?? glyph.label}
      aria-label={glyph.label}
    >
      {glyph.glyph}
    </span>
  );

  if (asLink && href) {
    return (
      <Link to={href} className="civic-glyph-link hover:scale-105 transition-transform">
        {inner}
      </Link>
    );
  }

  return inner;
}

export function CivicGlyphLegend({ compact }: { compact?: boolean }) {
  const items = ["church", "school", "festival", "vfd", "extension", "campaign", "race", "music"] as const;

  return (
    <div className={cn("civic-glyph-legend", compact && "text-xs")}>
      {!compact && <p className="text-xs font-semibold uppercase text-muted mb-2">Community glyph legend</p>}
      <ul className="flex flex-wrap gap-2">
        {items.map((kind) => {
          const g = CIVIC_GLYPHS[kind];
          return (
            <li key={kind} className="inline-flex items-center gap-1.5 chip chip-muted text-[10px] py-1">
              <CivicGlyph glyph={g} size="sm" />
              {g.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
