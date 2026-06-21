-- Intelligence layers + relationship density on ingestion candidates
ALTER TABLE civic_call.event_ingestion_candidates ADD COLUMN IF NOT EXISTS intelligence_layer TEXT;
ALTER TABLE civic_call.event_ingestion_candidates ADD COLUMN IF NOT EXISTS relationship_density_score INTEGER;
ALTER TABLE civic_call.event_ingestion_candidates ADD COLUMN IF NOT EXISTS typical_attendance_band TEXT;
ALTER TABLE civic_call.event_ingestion_candidates ADD COLUMN IF NOT EXISTS tradition_started_year INTEGER;
ALTER TABLE civic_call.event_ingestion_candidates ADD COLUMN IF NOT EXISTS recurring_registry_id TEXT;

CREATE INDEX IF NOT EXISTS ingestion_candidates_layer_idx ON civic_call.event_ingestion_candidates (intelligence_layer);
CREATE INDEX IF NOT EXISTS ingestion_candidates_rel_density_idx ON civic_call.event_ingestion_candidates (relationship_density_score DESC NULLS LAST);

-- Optional on live events for approved imports
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS intelligence_layer TEXT;
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS relationship_density_score INTEGER;
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS recurring_registry_id TEXT;
