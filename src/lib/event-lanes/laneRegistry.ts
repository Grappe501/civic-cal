import registryBundle from "../../../data/event-lanes/calendar-lane-registry.json";
import type { CalendarLaneDefinition } from "./laneTypes";

const registry = registryBundle as {
  version: string;
  lanes: CalendarLaneDefinition[];
  buildPhases: Record<string, { laneIds: string[] }>;
};

export function listLanes(): CalendarLaneDefinition[] {
  return registry.lanes.slice().sort((a, b) => a.buildOrder - b.buildOrder);
}

export function getLane(id: string): CalendarLaneDefinition | undefined {
  return registry.lanes.find((l) => l.id === id);
}

export function phase1LaneIds(): string[] {
  return registry.buildPhases.phase1?.laneIds ?? listLanes().filter((l) => l.phase === 1).map((l) => l.id);
}

export function phase2LaneIds(): string[] {
  return registry.buildPhases.phase2?.laneIds ?? [];
}

export const LANE_REGISTRY_VERSION = registry.version;
