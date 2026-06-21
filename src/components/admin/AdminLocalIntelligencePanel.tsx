import { useMemo, useState } from "react";
import { listCityDossiers, listCountyDossiers } from "../../lib/local-intelligence/registry";

type Section = "coverage" | "missing" | "low_confidence";

export function AdminLocalIntelligencePanel() {
  const [section, setSection] = useState<Section>("coverage");
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const cities = listCityDossiers(250);
  const counties = listCountyDossiers();

  const stats = useMemo(() => {
    const cityWithPop = cities.filter((c) => c.population != null).length;
    const cityLowConf = cities.filter((c) => c.confidenceScore < 35).length;
    const countyLowConf = counties.filter((c) => c.confidenceScore < 35).length;
    const missingEmployers = cities.filter((c) => !c.majorEmployers?.length).length;
    return { cityWithPop, cityLowConf, countyLowConf, missingEmployers, cityTotal: cities.length, countyTotal: counties.length };
  }, [cities, counties]);

  const lowConfCities = useMemo(() => cities.filter((c) => c.confidenceScore < 35).slice(0, 20), [cities]);
  const lowConfCounties = useMemo(() => counties.filter((c) => c.confidenceScore < 35).slice(0, 20), [counties]);
  const missingData = useMemo(
    () =>
      cities
        .filter((c) => !c.population || !c.sosTargetVotes)
        .slice(0, 25)
        .map((c) => ({
          city: c.city,
          missing: [!c.population && "population", !c.sosTargetVotes && "SOS targets", !c.majorEmployers?.length && "employers"].filter(Boolean),
        })),
    [cities],
  );

  async function handleImport(file: File) {
    setImportMsg(null);
    try {
      const text = await file.text();
      JSON.parse(text);
      setImportMsg(`Validated JSON (${file.name}). Deploy updated registry files to data/local-intelligence/ and rebuild.`);
    } catch {
      setImportMsg("Invalid JSON — import rejected.");
    }
  }

  const sections: { id: Section; label: string }[] = [
    { id: "coverage", label: "Coverage" },
    { id: "missing", label: "Missing data" },
    { id: "low_confidence", label: "Low confidence" },
  ];

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        City/county campaign intelligence dossiers — JSON registry + migration 011. Census/BLS hooks pending full import.
      </p>

      <div className="grid gap-3 sm:grid-cols-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-ark-pine">{stats.cityTotal}</p>
          <p className="text-xs text-muted">City dossiers</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-ark-pine">{stats.countyTotal}</p>
          <p className="text-xs text-muted">County dossiers</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-ark-pine">{stats.cityWithPop}</p>
          <p className="text-xs text-muted">With population</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-700">{stats.cityLowConf + stats.countyLowConf}</p>
          <p className="text-xs text-muted">Low confidence</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={section === s.id ? "chip bg-ark-pine text-white" : "chip bg-ark-wheat text-ark-pine"}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "coverage" && (
        <div className="space-y-4">
          <p className="text-sm">
            Registry: <code className="text-xs">data/local-intelligence/top-city-dossiers.json</code>,{" "}
            <code className="text-xs">county-dossiers.json</code>, <code className="text-xs">sos-election-targets.json</code>
          </p>
          <p className="text-sm text-muted">
            Regenerate: <code className="text-xs">npm run generate:local-intelligence</code>
          </p>
          <label className="block">
            <span className="text-sm font-medium">Import city/county dossier JSON (validate only)</span>
            <input
              type="file"
              accept=".json,application/json"
              className="input mt-2 text-xs"
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
            />
          </label>
          {importMsg && <p className="text-sm text-muted">{importMsg}</p>}
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => setImportMsg("AI summary refresh queued — candidate dashboards will request fresh summaries on next Ask AI.")}
          >
            Refresh AI summaries (advisory)
          </button>
        </div>
      )}

      {section === "missing" && (
        <ul className="space-y-2">
          {missingData.map((row) => (
            <li key={row.city} className="card text-sm flex justify-between gap-2">
              <span className="font-medium">{row.city}</span>
              <span className="text-xs text-muted">{row.missing.join(", ")}</span>
            </li>
          ))}
          {missingData.length === 0 && <p className="text-muted text-sm">No critical missing fields in top slice.</p>}
        </ul>
      )}

      {section === "low_confidence" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-sm mb-2">Cities (&lt;35% confidence)</h3>
            <ul className="text-sm space-y-1">
              {lowConfCities.map((c) => (
                <li key={c.city} className="flex justify-between">
                  <span>{c.city}</span>
                  <span className="text-muted">{c.confidenceScore}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2">Counties (&lt;35% confidence)</h3>
            <ul className="text-sm space-y-1">
              {lowConfCounties.map((c) => (
                <li key={c.county} className="flex justify-between">
                  <span>{c.county}</span>
                  <span className="text-muted">{c.confidenceScore}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
