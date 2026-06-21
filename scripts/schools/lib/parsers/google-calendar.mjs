/**
 * Pass 28 — discover Google Calendar embed ICS feeds.
 */
import { discoverIcsUrls } from "../parse-ics-feed.mjs";
import { parseIcsFeed } from "../parse-ics-feed.mjs";
import { classifySchoolLane } from "../school-lane-classifier.mjs";
import { platformConfidence } from "../platform-detector.mjs";

export function discoverGoogleCalendarIcs(html, pageUrl) {
  return discoverIcsUrls(html, pageUrl).filter(
    (u) => /google\.com\/calendar|gmail\.com\/calendar|calendars\./i.test(u) || u.includes(".ics"),
  );
}

export function parseGoogleCalendarIcs(icsText, sourceUrl) {
  return parseIcsFeed(icsText, sourceUrl).map((e) => ({
    ...e,
    platform: "google_calendar",
    confidence_score: Math.max(e.confidence_score ?? 0, platformConfidence("google_calendar")),
    lane_id: classifySchoolLane(`${e.title} ${e.raw_text ?? ""}`),
  }));
}
