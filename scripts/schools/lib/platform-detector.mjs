/**
 * Pass 28 — detect school calendar / athletics platform from URL + HTML.
 */
export const PLATFORMS = [
  "ics",
  "google_calendar",
  "json_ld",
  "localist",
  "apptegy",
  "thrillshare",
  "arbiterlive",
  "maxpreps",
  "dragonfly",
  "gofan",
  "rss",
  "generic_html",
];

export function detectPlatform(url, html = "") {
  const u = String(url ?? "").toLowerCase();
  const h = String(html ?? "").toLowerCase();

  if (/\.ics(\?|$)/i.test(u) || h.includes("begin:vcalendar")) return "ics";
  if (/calendar\.google\.com|google\.com\/calendar/i.test(u + h)) return "google_calendar";
  if (/localist\.com|\/api\/2\/events/i.test(u + h)) return "localist";
  if (/arbiterlive\.com|arbiter\.io/i.test(u + h)) return "arbiterlive";
  if (/maxpreps\.com/i.test(u + h)) return "maxpreps";
  if (/dragonflymax\.com|dragonfly\.com/i.test(u + h)) return "dragonfly";
  if (/gofan\.co|gofan\.net/i.test(u + h)) return "gofan";
  if (/apptegy\.|share\.apptegy\.io|5il\.co/i.test(u + h)) return "apptegy";
  if (/thrillshare\.|thrillshare\.com/i.test(u + h)) return "thrillshare";
  if (h.includes("application/ld+json") && /"@type"\s*:\s*"event"/i.test(h)) return "json_ld";
  if (/<rss|<feed[\s>]/i.test(h) || u.endsWith(".xml") || /\/rss\b/i.test(u)) return "rss";
  return "generic_html";
}

export function platformConfidence(platform) {
  const map = {
    ics: 75,
    json_ld: 72,
    localist: 70,
    google_calendar: 68,
    arbiterlive: 65,
    maxpreps: 62,
    apptegy: 60,
    thrillshare: 60,
    dragonfly: 58,
    gofan: 55,
    rss: 58,
    school_board_recurring: 52,
    generic_html: 50,
  };
  return map[platform] ?? 50;
}
