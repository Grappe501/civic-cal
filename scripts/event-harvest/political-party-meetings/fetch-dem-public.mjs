/**
 * Fetch Democratic county pages — direct HTML first, Jina reader fallback when blocked.
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.arkdems.org/counties/",
};

const JINA_PREFIX = "https://r.jina.ai/";

function isBlockedOrCaptcha(text) {
  const t = String(text);
  return (
    /just a moment|cloudflare|403 - forbidden|access denied|sgcaptcha|__CF\$cv\$params/i.test(t) ||
    (t.includes("<html") && t.length < 4000 && !/Meeting Info|County Chair/i.test(t))
  );
}

function isUsablePageText(text) {
  const t = String(text);
  if (isBlockedOrCaptcha(t)) return false;
  if (t.includes("Markdown Content:") || t.includes("Meeting Info")) return true;
  if (t.includes("County Chair") && t.length > 1500) return true;
  return t.length > 8000 && !t.includes("<html");
}

export async function fetchTextWithFallback(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    try {
      const direct = await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS });
      if (direct.ok) {
        const text = await direct.text();
        if (isUsablePageText(text)) {
          return { text, via: "direct" };
        }
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
    const body = await jina.text();
    return { text: body, via: "jina" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * List county CPT entries from WordPress REST (works when HTML is blocked).
 */
export async function fetchDemCountyCptList() {
  const out = [];
  let page = 1;
  while (page <= 3) {
    const url = new URL("https://www.arkdems.org/wp-json/wp/v2/county");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    url.searchParams.set("_fields", "slug,title,link");
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) break;
    const batch = await res.json();
    if (!Array.isArray(batch) || !batch.length) break;
    for (const row of batch) {
      const title = row.title?.rendered?.replace(/\s*County\s*$/i, "").trim() || null;
      out.push({
        slug: row.slug,
        county: title,
        url: row.link || `https://www.arkdems.org/county/${row.slug}/`,
      });
    }
    if (batch.length < 100) break;
    page++;
  }
  return out;
}

export function matchCountyName(cptCounty, counties) {
  if (!cptCounty) return null;
  const norm = (s) => s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const target = norm(cptCounty);
  return counties.find((c) => norm(c) === target || norm(`${c} County`) === target) || null;
}
