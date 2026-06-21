/**
 * Fetch county fair public pages — direct HTML first, Jina reader fallback.
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const JINA_PREFIX = "https://r.jina.ai/";

function isBlockedOrCaptcha(text) {
  const t = String(text);
  return (
    /just a moment|cloudflare|403 - forbidden|access denied|sgcaptcha|__CF\$cv\$params/i.test(t) ||
    (t.includes("<html") && t.length < 3000 && !/fair|schedule|2026|livestock/i.test(t))
  );
}

function isUsableFairPage(text) {
  const t = String(text);
  if (isBlockedOrCaptcha(t)) return false;
  if (t.includes("Markdown Content:")) return true;
  if (/county fair|fairgrounds|livestock|schedule|2026|admission|4-?h/i.test(t) && t.length > 1500) return true;
  return t.length > 6000 && !t.includes("<html");
}

export async function fetchFairText(url, timeoutMs = 22000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    try {
      const direct = await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS });
      if (direct.ok) {
        const text = await direct.text();
        if (isUsableFairPage(text)) return { text, via: "direct", url };
      }
    } catch {
      /* fall through */
    }

    const jinaUrl = url.startsWith(JINA_PREFIX) ? url : `${JINA_PREFIX}${url}`;
    const jina = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: { Accept: "text/plain", "User-Agent": BROWSER_HEADERS["User-Agent"] },
    });
    if (!jina.ok) throw new Error(`Jina fetch HTTP ${jina.status}`);
    return { text: await jina.text(), via: "jina", url };
  } finally {
    clearTimeout(timer);
  }
}

export function extractHrefLinks(html, baseUrl) {
  const links = new Map();
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1].trim();
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      if (href.startsWith("/")) href = new URL(href, baseUrl).href;
      else if (!/^https?:/i.test(href)) href = new URL(href, baseUrl).href;
      links.set(href, href);
    } catch {
      /* skip bad urls */
    }
  }
  return [...links.values()];
}

export function classifyFairLinks(links, pageText = "") {
  const blob = `${links.join(" ")} ${pageText}`.toLowerCase();
  const pick = (patterns) => links.find((u) => patterns.some((p) => u.toLowerCase().includes(p))) ?? null;
  return {
    schedule_url: pick(["schedule", "calendar", "events"]),
    ticket_url: pick(["ticket", "admission", "gate"]),
    vendor_url: pick(["vendor", "exhibitor"]),
    livestock_url: pick(["livestock", "4-h", "4h", "ffa"]),
    pageant_url: pick(["pageant", "queen", "princess"]),
    parade_url: pick(["parade"]),
    rodeo_url: pick(["rodeo"]),
    carnival_url: pick(["carnival", "midway"]),
    demolition_derby_url: pick(["demolition", "derby"]),
    fair_book_pdf: links.find((u) => /\.pdf$/i.test(u) && /fair|book|schedule|premium/i.test(u)) ?? null,
    facebook_url: links.find((u) => /facebook\.com/i.test(u)) ?? null,
    sponsorship_url: pick(["sponsor", "partnership"]),
    has_history_hint: /\b(since|established|annual|\d+(st|nd|rd|th)\s+annual)\b/i.test(pageText),
  };
}

export function extensionOfficeUrl(county) {
  const slug = String(county)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .replace(/'/g, "");
  return `https://www.uaex.uada.edu/counties/${slug}/`;
}

export function fairEntrySearchUrl(county) {
  return `https://fairentry.com/FairSearch?state=AR&query=${encodeURIComponent(`${county} County Fair`)}`;
}
