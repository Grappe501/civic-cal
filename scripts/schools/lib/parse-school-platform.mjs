/**
 * Pass 28 — route HTML/JSON/ICS to platform-specific school parsers.
 */
import { detectPlatform } from "./platform-detector.mjs";
import { parseIcsFeed, discoverIcsUrls } from "./parse-ics-feed.mjs";
import { classifySchoolLane } from "./school-lane-classifier.mjs";
import { parseSchoolCalendarHtml } from "./parse-school-calendar-html.mjs";
import { parseJsonLdEvents } from "./parsers/json-ld.mjs";
import { discoverGoogleCalendarIcs, parseGoogleCalendarIcs } from "./parsers/google-calendar.mjs";
import { localistApiCandidates, parseLocalistJson } from "./parsers/localist.mjs";
import { discoverApptegyFeedUrls, parseApptegyThrillshareHtml } from "./parsers/apptegy-thrillshare.mjs";
import { discoverArbiterUrls, parseArbiterLiveHtml } from "./parsers/arbiterlive.mjs";
import { discoverMaxPrepsUrls, parseMaxPrepsHtml } from "./parsers/maxpreps.mjs";
import {
  discoverDragonFlyUrls,
  discoverGoFanUrls,
  parseDragonFlyHtml,
  parseGoFanHtml,
} from "./parsers/dragonfly-gofan.mjs";
import { parseSchoolBoardRecurring } from "./parsers/school-board-recurring.mjs";

function tagEvents(events, platform) {
  return events.map((e) => ({
    ...e,
    platform: e.platform ?? platform,
    lane_id: e.lane_id ?? classifySchoolLane(`${e.title} ${e.raw_text ?? ""}`),
  }));
}

export function discoverFollowUpUrls(platform, html, pageUrl) {
  const urls = new Set();
  if (platform === "google_calendar" || platform === "generic_html" || platform === "ics") {
    for (const u of discoverIcsUrls(html, pageUrl)) urls.add(u);
    for (const u of discoverGoogleCalendarIcs(html, pageUrl)) urls.add(u);
  }
  if (platform === "apptegy" || platform === "thrillshare" || platform === "generic_html") {
    for (const u of discoverApptegyFeedUrls(html, pageUrl)) urls.add(u);
  }
  if (platform === "arbiterlive" || platform === "generic_html") {
    for (const u of discoverArbiterUrls(html, pageUrl)) urls.add(u);
  }
  if (platform === "maxpreps" || platform === "generic_html") {
    for (const u of discoverMaxPrepsUrls(html)) urls.add(u);
  }
  if (platform === "generic_html") {
    for (const u of discoverDragonFlyUrls(html)) urls.add(u);
    for (const u of discoverGoFanUrls(html)) urls.add(u);
  }
  if (platform === "localist") {
    for (const u of localistApiCandidates(pageUrl)) urls.add(u);
    try {
      const origin = new URL(pageUrl).origin;
      if (/calendar\.|calendars\./i.test(origin)) {
        for (let i = 1; i <= 8; i++) urls.add(`http://calendars.uark.edu/calendar/${i}.ics`.replace("uark.edu", new URL(origin).hostname.replace("calendar.", "calendars.")));
        for (let i = 1; i <= 8; i++) {
          urls.add(`${origin.replace("calendar.", "calendars.")}/calendar/${i}.ics`);
          urls.add(`http://calendars.uark.edu/calendar/${i}.ics`);
        }
      }
    } catch {
      /* ignore */
    }
  }
  return [...urls];
}

export function parseSchoolPlatform({ body, url, institutionName, contentType = "" }) {
  const platform = detectPlatform(url, body);
  const events = [];

  if (platform === "ics" || body.includes("BEGIN:VCALENDAR") || contentType.includes("calendar")) {
    events.push(...tagEvents(parseIcsFeed(body, url), "ics"));
  } else if (platform === "localist" && body.trim().startsWith("{")) {
    try {
      events.push(...parseLocalistJson(JSON.parse(body), url));
    } catch {
      /* fall through */
    }
  } else {
    events.push(...parseJsonLdEvents(body, url));
    events.push(...parseApptegyThrillshareHtml(body, url));
    events.push(...parseArbiterLiveHtml(body, url));
    events.push(...parseMaxPrepsHtml(body, url));
    events.push(...parseDragonFlyHtml(body, url));
    events.push(...parseGoFanHtml(body, url));
    events.push(
      ...tagEvents(parseSchoolCalendarHtml(body, url), "generic_html").map((e) => ({
        ...e,
        lane_id: e.lane_id,
        platform: "generic_html",
      })),
    );
    events.push(...parseSchoolBoardRecurring(body, url, institutionName));
  }

  const seen = new Set();
  return {
    platform,
    events: events.filter((e) => {
      if (!e.title || !e.event_date) return false;
      e.source_url = e.source_url || url;
      if (!e.source_url) return false;
      const key = `${e.event_date}|${e.title.slice(0, 40)}|${e.platform}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return e.event_date >= "2026-01-01" && e.event_date <= "2027-12-31";
    }),
    followUpUrls: discoverFollowUpUrls(platform, body, url),
  };
}

export function parseIcsBody(body, url) {
  return { platform: "ics", events: tagEvents(parseIcsFeed(body, url), "ics"), followUpUrls: [] };
}

export function parseGoogleIcsBody(body, url) {
  return { platform: "google_calendar", events: parseGoogleCalendarIcs(body, url), followUpUrls: [] };
}
