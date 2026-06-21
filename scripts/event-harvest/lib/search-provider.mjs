/**
 * Search provider abstraction — Bing or Google Custom Search when keys exist;
 * otherwise returns planned queries only (lawful dry-run mode).
 */

export async function searchWeb(query, opts = {}) {
  const bingKey = process.env.BING_SEARCH_API_KEY;
  const googleKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const googleCx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (bingKey) {
    const url = new URL("https://api.bing.microsoft.com/v7.0/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(opts.limit ?? 10));
    const res = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": bingKey } });
    if (!res.ok) throw new Error(`Bing search failed: ${res.status}`);
    const data = await res.json();
    return (data.webPages?.value ?? []).map((r) => ({
      title: r.name,
      url: r.url,
      snippet: r.snippet,
      provider: "bing",
    }));
  }

  if (googleKey && googleCx) {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", googleKey);
    url.searchParams.set("cx", googleCx);
    url.searchParams.set("q", query);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google CSE failed: ${res.status}`);
    const data = await res.json();
    return (data.items ?? []).map((r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      provider: "google_cse",
    }));
  }

  return null;
}

export function hasSearchProvider() {
  return Boolean(
    process.env.BING_SEARCH_API_KEY ||
      (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID),
  );
}
