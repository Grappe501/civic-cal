/**
 * Pass 27 — parse ICS (VEVENT) feeds for school/college calendar harvest.
 */
const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function unfoldIcs(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .reduce((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }
      return lines;
    }, []);
}

function parseIcsDate(value) {
  if (!value) return null;
  const v = value.trim();
  if (/^\d{8}T\d{6}Z$/i.test(v)) {
    const y = v.slice(0, 4);
    const m = v.slice(4, 6);
    const d = v.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
  if (/^\d{8}$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return null;
}

export function parseIcsFeed(icsText, sourceUrl) {
  const lines = unfoldIcs(icsText);
  const events = [];
  let cur = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur?.startDate) {
        events.push({
          title: (cur.summary || "Calendar event").slice(0, 180),
          event_date: cur.startDate,
          description: cur.description?.slice(0, 400) ?? null,
          source_url: cur.url || sourceUrl,
          confidence_score: 70,
          raw_text: cur.description || cur.summary || "",
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).split(";")[0].toUpperCase();
    const val = line.slice(idx + 1).trim();

    if (key === "DTSTART") cur.startDate = parseIcsDate(val);
    else if (key === "SUMMARY") cur.summary = val.replace(/\\n/g, " ").replace(/\\,/g, ",");
    else if (key === "DESCRIPTION") cur.description = val.replace(/\\n/g, " ").replace(/\\,/g, ",");
    else if (key === "URL") cur.url = val;
    else if (key === "LOCATION") cur.location = val;
  }

  const min = "2026-01-01";
  const max = "2027-12-31";
  return events.filter((e) => e.event_date >= min && e.event_date <= max).slice(0, 120);
}

/**
 * Discover .ics / webcal URLs embedded in HTML.
 */
export function discoverIcsUrls(html, pageUrl) {
  const found = new Set();
  const base = new URL(pageUrl);

  const patterns = [
    /https?:\/\/[^"'\\s]+\.ics/gi,
    /webcal:\/\/[^"'\\s]+\.ics/gi,
    /cid=([^"'\\s]+%2F[^"'\\s]+\.ics[^"'\\s]*)/gi,
    /cid=([^"'\\s]*\/[^"'\\s]+\.ics)/gi,
  ];

  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html)) !== null) {
      let url = m[1] ?? m[0];
      if (url.startsWith("webcal://")) url = url.replace(/^webcal:\/\//i, "https://");
      try {
        if (url.includes("%")) url = decodeURIComponent(url);
      } catch {
        /* keep encoded */
      }
      if (url.startsWith("http")) found.add(url);
      else if (url.startsWith("/")) found.add(new URL(url, base).href);
    }
  }

  return [...found];
}
