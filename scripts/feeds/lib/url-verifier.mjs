/**
 * Pass 23C — verify public feed URLs with caching.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const CACHE_FILE = path.join(ROOT, "data/feeds/feed-url-verify-cache.json");

const UA = "ArkansasEverywhere-FeedBot/1.0 (+https://arkansaseverywhere.org)";

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return { entries: {} };
  }
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function verifyUrl(url, opts = {}) {
  const cache = opts.cache ?? loadCache();
  const key = url.trim().toLowerCase();
  if (cache.entries[key]) return cache.entries[key];

  const result = { url, ok: false, status: null, method: null, checkedAt: new Date().toISOString() };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);

  try {
    for (const method of ["HEAD", "GET"]) {
      try {
        const res = await fetch(url, {
          method,
          signal: controller.signal,
          redirect: "follow",
          headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
        });
        result.status = res.status;
        result.method = method;
        if (res.status >= 200 && res.status < 400) {
          result.ok = true;
          break;
        }
      } catch {
        /* try GET if HEAD fails */
      }
    }
  } catch (e) {
    result.error = String(e.message || e).slice(0, 120);
  } finally {
    clearTimeout(timer);
  }

  cache.entries[key] = result;
  if (opts.writeCache !== false) saveCache(cache);
  return result;
}

export async function verifyBatch(urls, opts = {}) {
  const concurrency = opts.concurrency ?? 6;
  const unique = [...new Set(urls.filter(Boolean))];
  const results = new Map();
  let i = 0;

  async function worker() {
    while (i < unique.length) {
      const idx = i++;
      const url = unique[idx];
      results.set(url, await verifyUrl(url, { ...opts, writeCache: idx % 20 === 19 }));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, () => worker()));
  saveCache(loadCache());
  return results;
}

export function firstVerified(candidates, verifyMap) {
  for (const url of candidates) {
    const v = verifyMap.get(url);
    if (v?.ok) return { url, verification: v };
  }
  return null;
}
