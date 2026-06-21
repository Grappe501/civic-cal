/** WCAG contrast helpers for dynamic brand / badge colors */

const HEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
const HEX_SHORT = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

function expandHex(hex: string): string | null {
  const trimmed = hex.trim();
  if (HEX.test(trimmed)) return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const short = trimmed.match(HEX_SHORT);
  if (!short) return null;
  return `#${short.slice(1).map((c) => c + c).join("")}`;
}

function rgb(hex: string): [number, number, number] | null {
  const normalized = expandHex(hex);
  if (!normalized) return null;
  const m = normalized.match(HEX);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = rgb(foreground);
  const bg = rgb(background);
  if (!fg || !bg) return 1;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const LIGHT_TEXT = "#FFFFFF";
const DARK_TEXT = "#1A1F2E";

/** Pick light or dark text that meets ~4.5:1 on the given background when possible. */
export function pickReadableText(
  background: string,
  options?: { minRatio?: number; light?: string; dark?: string },
): string {
  const minRatio = options?.minRatio ?? 4.5;
  const light = options?.light ?? LIGHT_TEXT;
  const dark = options?.dark ?? DARK_TEXT;
  const lightRatio = contrastRatio(light, background);
  const darkRatio = contrastRatio(dark, background);
  if (lightRatio >= minRatio && lightRatio >= darkRatio) return light;
  if (darkRatio >= minRatio) return dark;
  return darkRatio >= lightRatio ? dark : light;
}

export function darkenHex(hex: string, amount = 0.15): string {
  const parts = rgb(hex);
  if (!parts) return hex;
  const mix = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  const [r, g, b] = parts.map(mix) as [number, number, number];
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function lightenHex(hex: string, amount = 0.12): string {
  const parts = rgb(hex);
  if (!parts) return hex;
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
  const [r, g, b] = parts.map(mix) as [number, number, number];
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function isLightBackground(hex: string): boolean {
  const parts = rgb(hex);
  if (!parts) return false;
  return relativeLuminance(parts) > 0.55;
}
