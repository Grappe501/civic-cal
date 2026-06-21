/**
 * Pass 23C — candidate URL generation from patterns + institutions.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

export function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/^-|-$/g, "");
}

export function titleCase(s) {
  return String(s).replace(/\s+/g, " ").trim();
}

function fill(pattern, vars) {
  return pattern.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export function candidatesForSlot(feed, patterns) {
  const slotPatterns = patterns.slotPatterns?.[feed.slot_type] ?? [];
  const citySlug = slug(feed.city ?? feed.county ?? "");
  const countySlug = slug(feed.county ?? "");
  const countyTitle = titleCase(feed.county ?? "").replace(/\s+/g, "-");
  const vars = { citySlug, countySlug, countyTitle };
  const urls = slotPatterns.map((p) => fill(p, vars)).filter((u) => u.startsWith("http"));
  if (feed.contact_url?.startsWith("http") && !feed.contact_url.includes("google.com")) urls.unshift(feed.contact_url);
  if (feed.calendar_url?.startsWith("http")) urls.unshift(feed.calendar_url);
  return [...new Set(urls)];
}

export function candidatesForInstitution(inst, patterns) {
  const urls = [];
  const citySlug = slug(inst.city ?? inst.county ?? "");
  const type = inst.institution_type ?? inst.org_type ?? inst.type ?? "organization";
  const patternKey = type.includes("school") ? "school" : type.includes("church") ? "church" : type.includes("library") ? "library" : type.includes("chamber") ? "chamber" : type.includes("college") ? "college" : null;

  if (inst.website?.startsWith("http")) urls.push(inst.website);
  if (inst.calendar_url?.startsWith("http")) urls.push(inst.calendar_url);
  if (inst.campus_calendar_url?.startsWith("http")) urls.push(inst.campus_calendar_url);
  for (const link of inst.source_links ?? []) {
    if (link.url?.startsWith("http") && !link.url.includes("arkansas.gov/education")) urls.push(link.url);
  }

  const name = inst.institution_name ?? inst.school_name ?? inst.church_name ?? inst.name ?? "";
  const known = patterns.knownCollegeUrls?.[name];
  if (known) urls.push(known);

  if (patternKey && patterns.institutionPatterns?.[patternKey]) {
    for (const p of patterns.institutionPatterns[patternKey]) {
      urls.push(fill(p, { citySlug, countySlug: slug(inst.county ?? "") }));
    }
  }

  return [...new Set(urls.filter((u) => u.startsWith("http")))];
}

export function loadInstitutions() {
  const schools = (readJson("data/institutions/school-directory.json").schools ?? []).map((s) => ({
    ...s,
    institution_kind: "school",
    label: s.school_name,
  }));
  const churches = (readJson("data/institutions/church-directory.json").churches ?? []).map((c) => ({
    ...c,
    institution_kind: "church",
    label: c.church_name,
  }));
  const colleges = (readJson("data/institutions/college-directory.json").colleges ?? []).map((c) => ({
    ...c,
    institution_kind: "college",
    label: c.institution_name,
  }));
  const orgs = (readJson("data/institutions/civic-organizations.json").organizations ?? []).map((o) => ({
    ...o,
    institution_kind: "organization",
    label: o.name,
  }));
  return [...schools, ...churches, ...colleges, ...orgs];
}

export function annualYield(sourceType, patterns) {
  return patterns.annualYieldForecast?.[sourceType] ?? patterns.annualYieldForecast?.[sourceType.replace(/-/g, "_")] ?? 10;
}
