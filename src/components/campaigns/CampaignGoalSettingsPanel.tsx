import { useEffect, useState } from "react";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import {
  defaultCampaignGoalSettings,
  loadCampaignGoalSettings,
  saveCampaignGoalSettings,
  type CampaignGoalSettings,
} from "../../lib/campaigns/campaignGoalSettings";

interface Props {
  workspace: CampaignWorkspace;
}

export function CampaignGoalSettingsPanel({ workspace }: Props) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<CampaignGoalSettings>(() => ({
    ...defaultCampaignGoalSettings(),
    priorityCounties: [...workspace.counties],
    priorityCities: [...workspace.cities],
    statewideFocus: workspace.districtScope.mode === "statewide",
  }));

  useEffect(() => {
    const saved = loadCampaignGoalSettings(workspace.slug);
    if (saved) setSettings({ ...defaultCampaignGoalSettings(), ...saved });
  }, [workspace.slug]);

  function save() {
    saveCampaignGoalSettings(workspace.slug, settings);
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" className="btn-secondary text-sm mb-6" onClick={() => setOpen(true)}>
        Campaign goal settings
      </button>
    );
  }

  return (
    <section className="card-readable mb-6 text-sm space-y-3">
      <h3 className="font-semibold">Campaign goal settings</h3>
      <label className="block">
        <span className="text-caption">Priority counties (comma-separated)</span>
        <input
          className="input w-full mt-1"
          value={settings.priorityCounties.join(", ")}
          onChange={(e) => setSettings({ ...settings, priorityCounties: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        />
      </label>
      <label className="block">
        <span className="text-caption">Priority cities</span>
        <input
          className="input w-full mt-1"
          value={settings.priorityCities.join(", ")}
          onChange={(e) => setSettings({ ...settings, priorityCities: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        />
      </label>
      <label className="block">
        <span className="text-caption">Max travel radius (miles)</span>
        <input
          type="number"
          className="input w-full mt-1"
          value={settings.maxTravelRadiusMiles ?? ""}
          onChange={(e) => setSettings({ ...settings, maxTravelRadiusMiles: e.target.value ? Number(e.target.value) : null })}
        />
      </label>
      <label className="block">
        <span className="text-caption">Volunteer capacity</span>
        <input
          type="number"
          className="input w-full mt-1"
          value={settings.volunteerCapacity ?? ""}
          onChange={(e) => setSettings({ ...settings, volunteerCapacity: e.target.value ? Number(e.target.value) : null })}
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={settings.statewideFocus} onChange={(e) => setSettings({ ...settings, statewideFocus: e.target.checked })} />
        Statewide focus
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={settings.surrogateAvailability} onChange={(e) => setSettings({ ...settings, surrogateAvailability: e.target.checked })} />
        Surrogate available
      </label>
      <select
        className="input w-full"
        value={settings.candidateAvailability}
        onChange={(e) => setSettings({ ...settings, candidateAvailability: e.target.value as CampaignGoalSettings["candidateAvailability"] })}
      >
        <option value="full">Candidate fully available</option>
        <option value="limited">Limited availability</option>
        <option value="surrogate_only">Surrogate only</option>
      </select>
      <div className="flex gap-2">
        <button type="button" className="btn-primary text-sm" onClick={save}>Save</button>
        <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p className="text-caption">Stored in browser localStorage until DB sync is ready.</p>
    </section>
  );
}
