-- Pass 9: Candidate public presence + AI strategic search

ALTER TABLE civic_call.campaign_event_plans
  ADD COLUMN IF NOT EXISTS surrogate_attending BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_presence_status TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS show_candidate_attending BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_volunteers_needed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_surrogate_attending BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_note TEXT,
  ADD COLUMN IF NOT EXISTS volunteer_public_note TEXT,
  ADD COLUMN IF NOT EXISTS candidate_color TEXT,
  ADD COLUMN IF NOT EXISTS volunteer_color TEXT;

CREATE TABLE IF NOT EXISTS civic_call.campaign_ai_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES civic_call.campaign_workspaces(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_context JSONB DEFAULT '{}'::jsonb,
  answer_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_ai_queries_workspace ON civic_call.campaign_ai_queries(workspace_id, created_at DESC);

-- Wendy Peer — Arkansas State Representative (district pending)
INSERT INTO civic_call.campaign_workspaces (
  slug, campaign_name, candidate_name, office_sought, district_type, district_name,
  counties, cities, district_scope, dashboard_theme, dashboard_label, notes,
  is_active, access_mode
) VALUES (
  'wendy-peer-house',
  'Wendy Peer for Arkansas House',
  'Wendy Peer',
  'Arkansas State Representative',
  'state_house',
  'Arkansas State House — district pending',
  '["Sebastian","Crawford","Franklin"]'::jsonb,
  '["Fort Smith","Van Buren","Alma","Ozark"]'::jsonb,
  '{"mode":"state_house","districtCode":"HD-PENDING","counties":["Sebastian","Crawford","Franklin"],"cities":["Fort Smith","Van Buren"],"boundaryPrecision":"pending","boundaryNote":"State House district number pending confirmation — placeholder scope needs confirmation"}'::jsonb,
  '{"primaryColor":"#7B3F00","accentColor":"#D4A574","surfaceColor":"#FBF5EE","heroTagline":"Strong local voice — River Valley communities first.","logoInitials":"WP","badgeLabel":"State House · District pending"}'::jsonb,
  'Wendy Peer — House Command',
  'Placeholder scope — Sebastian / River Valley until HD district confirmed.',
  true,
  'private_admin'
)
ON CONFLICT (slug) DO UPDATE SET
  campaign_name = EXCLUDED.campaign_name,
  candidate_name = EXCLUDED.candidate_name,
  office_sought = EXCLUDED.office_sought,
  district_type = EXCLUDED.district_type,
  district_name = EXCLUDED.district_name,
  counties = EXCLUDED.counties,
  cities = EXCLUDED.cities,
  district_scope = EXCLUDED.district_scope,
  dashboard_theme = EXCLUDED.dashboard_theme,
  dashboard_label = EXCLUDED.dashboard_label,
  notes = EXCLUDED.notes,
  updated_at = now();
