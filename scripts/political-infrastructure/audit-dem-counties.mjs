#!/usr/bin/env node
import fs from "node:fs";
import { fetchTextWithFallback } from "../event-harvest/political-party-meetings/fetch-dem-public.mjs";
import { parseDemCountyPageText } from "../event-harvest/political-party-meetings/parse-dem-county-page.mjs";
import { parseRecurrenceRule, expandRecurrenceDates } from "../event-harvest/political-party-meetings/parse-recurring-meetings.mjs";

const counties = JSON.parse(fs.readFileSync("data/arkansas-counties.json", "utf8")).counties;
const limit = Number(process.env.AUDIT_LIMIT ?? counties.length);
let withInfo = 0;
let withDates = 0;
let failed = 0;
const unparsed = [];

for (const county of counties.slice(0, limit)) {
  const slug = county.toLowerCase().replace(/\s+/g, "-");
  const url = `https://www.arkdems.org/county/${slug}/`;
  try {
    const { text } = await fetchTextWithFallback(url);
    const p = parseDemCountyPageText(text, county, url);
    if (p.meeting_info) {
      withInfo++;
      const rule = parseRecurrenceRule(p.meeting_info);
      const dates = expandRecurrenceDates(rule, { start: "2026-06-20", end: "2027-12-31" });
      if (dates.length) withDates++;
      else unparsed.push({ county, info: p.meeting_info });
    }
    await new Promise((r) => setTimeout(r, 400));
  } catch {
    failed++;
  }
}

console.log(JSON.stringify({ withInfo, withDates, failed, unparsed: unparsed.slice(0, 20) }, null, 2));
