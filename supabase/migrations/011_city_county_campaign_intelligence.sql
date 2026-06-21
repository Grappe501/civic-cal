-- Pass 11: Candidate city/county intelligence (private campaign layer)

CREATE TABLE IF NOT EXISTS civic_call.city_intelligence_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  region TEXT,
  priority_rank INTEGER,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city, county)
);

CREATE TABLE IF NOT EXISTS civic_call.county_intelligence_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county TEXT NOT NULL UNIQUE,
  region TEXT,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS civic_call.campaign_local_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES civic_call.campaign_workspaces(id) ON DELETE CASCADE,
  city TEXT,
  county TEXT,
  note_type TEXT NOT NULL DEFAULT 'field_note',
  note_text TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_local_notes_workspace_idx ON civic_call.campaign_local_notes (workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS civic_call.campaign_vote_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES civic_call.campaign_workspaces(id) ON DELETE CASCADE,
  geography_type TEXT NOT NULL,
  geography_name TEXT NOT NULL,
  baseline_votes INTEGER,
  target_votes INTEGER,
  current_projection INTEGER,
  vote_gap INTEGER,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, geography_type, geography_name)
);

CREATE INDEX IF NOT EXISTS campaign_vote_targets_workspace_idx ON civic_call.campaign_vote_targets (workspace_id);
