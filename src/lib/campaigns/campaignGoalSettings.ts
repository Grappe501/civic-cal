export interface CampaignGoalSettings {
  priorityCounties: string[];
  priorityCities: string[];
  maxTravelRadiusMiles: number | null;
  availableDays: string[];
  availableTimeWindows: string[];
  preferredEventTypes: string[];
  volunteerCapacity: number | null;
  candidateAvailability: "full" | "limited" | "surrogate_only";
  surrogateAvailability: boolean;
  statewideFocus: boolean;
  updatedAt: string;
}

const KEY = (slug: string) => `civic-campaign-goals:${slug}`;

export function defaultCampaignGoalSettings(): CampaignGoalSettings {
  return {
    priorityCounties: [],
    priorityCities: [],
    maxTravelRadiusMiles: null,
    availableDays: [],
    availableTimeWindows: [],
    preferredEventTypes: [],
    volunteerCapacity: null,
    candidateAvailability: "full",
    surrogateAvailability: true,
    statewideFocus: false,
    updatedAt: new Date().toISOString(),
  };
}

export function loadCampaignGoalSettings(slug: string): CampaignGoalSettings | null {
  try {
    const raw = localStorage.getItem(KEY(slug));
    if (!raw) return null;
    return JSON.parse(raw) as CampaignGoalSettings;
  } catch {
    return null;
  }
}

export function saveCampaignGoalSettings(slug: string, settings: CampaignGoalSettings): void {
  localStorage.setItem(KEY(slug), JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }));
}
