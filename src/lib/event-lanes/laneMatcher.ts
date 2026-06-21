import type { CivicEvent } from "../types";
import type { CalendarLaneDefinition } from "./laneTypes";
import { listLanes } from "./laneRegistry";

function eventText(e: CivicEvent): string {
  return `${e.title} ${e.description ?? ""} ${e.hostOrganization ?? ""} ${e.category ?? ""}`.toLowerCase();
}

export function eventMatchesLane(e: CivicEvent, lane: CalendarLaneDefinition): boolean {
  if (lane.id === "host_submitted") {
    return e.source === "host";
  }
  if (lane.id === "student_service") {
    return /student service|service hours|service learning/i.test(eventText(e));
  }
  const text = eventText(e);
  return lane.matchPatterns.some((p) => text.includes(p.toLowerCase()));
}

export function classifyEventLanes(e: CivicEvent): string[] {
  return listLanes().filter((lane) => eventMatchesLane(e, lane)).map((l) => l.id);
}

export function filterEventsByLane(events: CivicEvent[], laneId: string): CivicEvent[] {
  const lane = listLanes().find((l) => l.id === laneId);
  if (!lane) return [];
  return events.filter((e) => eventMatchesLane(e, lane));
}
