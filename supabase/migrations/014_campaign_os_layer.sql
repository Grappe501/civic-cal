-- Pass 15: Campaign OS — campaign events + institution relationship touchpoints

CREATE TABLE IF NOT EXISTS civic_call.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  county TEXT,
  city TEXT,
  venue TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_events_workspace_start_idx
  ON civic_call.campaign_events (workspace_slug, start_at);

CREATE TABLE IF NOT EXISTS civic_call.institution_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_slug TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  kind TEXT NOT NULL,
  county TEXT NOT NULL,
  city TEXT,
  attended_at DATE NOT NULL,
  event_title TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS institution_touchpoints_workspace_idx
  ON civic_call.institution_touchpoints (workspace_slug, county, kind);

COMMENT ON TABLE civic_call.campaign_events IS 'Campaign-owned events (fundraisers, canvasses, town halls) — distinct from community calendar';
COMMENT ON TABLE civic_call.institution_touchpoints IS 'Institution relationship log — Rotary, Farm Bureau, churches, etc.';
