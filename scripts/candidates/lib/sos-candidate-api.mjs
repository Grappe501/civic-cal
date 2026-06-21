/**
 * Fetch and normalize Arkansas SOS candidate filings (candidates.arkansas.gov).
 */
const SOS_BASE = "https://candidates.arkansas.gov";
const USER_AGENT = "ArkansasEverywhere-CivicBot/1.0 (+https://arkansaseverywhere.org)";

const PARTIES = ["Democratic", "Republican", "Libertarian", "Independent", "Non Partisan Judicial"];

export async function fetchSosCandidates() {
  const records = [];
  const notes = [];

  // Primary: METL REST plugin
  try {
    const allRes = await fetch(`${SOS_BASE}/wp-json/metl/v1/all`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
    const allText = await allRes.text();
    if (allText.trim()) {
      const parsed = JSON.parse(allText);
      const rows = Array.isArray(parsed) ? parsed : parsed?.data ?? parsed?.results ?? [];
      records.push(...rows.map(normalizeSosRow));
      notes.push(`metl/v1/all: ${rows.length} rows`);
    } else {
      notes.push("metl/v1/all: empty response");
    }
  } catch (e) {
    notes.push(`metl/v1/all error: ${e.message}`);
  }

  // Party-filtered find endpoints
  for (const party of PARTIES) {
    try {
      const url = `${SOS_BASE}/wp-json/metl/v1/find?PartyAffiliation=${encodeURIComponent(party)}`;
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": USER_AGENT } });
      const text = await res.text();
      if (!text.trim()) continue;
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : parsed?.data ?? [];
      for (const row of rows) {
        records.push(normalizeSosRow(row, party));
      }
      if (rows.length) notes.push(`find/${party}: ${rows.length}`);
    } catch (_) {}
  }

  return { records: dedupeCandidates(records), notes };
}

function normalizeSosRow(row, partyFallback) {
  const first = row.NameF ?? row.name_f ?? row.first_name ?? "";
  const last = row.NameL ?? row.name_l ?? row.last_name ?? "";
  const name = [first, last].filter(Boolean).join(" ").trim() || row.CandidateName || row.name || "Unknown";
  const party = row.PartyAffiliation ?? row.party ?? partyFallback ?? null;
  const office = row.Descript ?? row.office ?? row.position ?? row.Position ?? "Unknown office";
  const county = row.County ?? row.county ?? null;
  const city = row.City ?? row.city ?? null;
  const filingDate = row.FilingDate ?? row.filing_date ?? null;

  return {
    name,
    office,
    party: normalizeParty(party, office),
    race_type: raceTypeFromParty(party, office),
    district: extractDistrict(office),
    county,
    city,
    website: row.Website ?? row.website ?? null,
    public_contact: formatContact(row),
    source_url: `${SOS_BASE}/`,
    source: "arkansas_sos_candidate_search",
    filing_status: filingDate ? "filed" : "listed",
    filing_date: filingDate,
    filing_order: row.FilingOrder ?? null,
    verification_status: "official_sos",
    raw: row,
  };
}

function normalizeParty(party, office) {
  if (!party) return /judicial|nonpartisan|non-partisan/i.test(office) ? null : null;
  if (/non.?partisan|judicial/i.test(String(party))) return null;
  return String(party).trim();
}

function raceTypeFromParty(party, office) {
  if (/judicial|non.?partisan/i.test(String(party ?? "")) || /judicial|non.?partisan/i.test(office)) return "nonpartisan";
  if (party) return "partisan";
  return "nonpartisan";
}

function extractDistrict(office) {
  const m = String(office).match(/district\s*(\d+|[A-Z0-9-]+)/i);
  return m ? m[1] : null;
}

function formatContact(row) {
  const parts = [];
  if (row.Address1) parts.push(row.Address1);
  if (row.CamAddress1) parts.push(`Campaign: ${row.CamAddress1}`);
  if (row.Email) parts.push(row.Email);
  if (row.Phone) parts.push(row.Phone);
  return parts.length ? parts.join(" · ") : null;
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function candidateSlug(name, office) {
  return slugify(`${name}-${office}`.slice(0, 96));
}

function dedupeCandidates(list) {
  const seen = new Set();
  return list.filter((c) => {
    const key = `${c.name}|${c.office}|${c.party ?? "NP"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { slugify };
