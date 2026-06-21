-- Named campaign workspaces — slug, theme, scope, access control

ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS district_scope JSONB NOT NULL DEFAULT '{}';
ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS dashboard_theme JSONB NOT NULL DEFAULT '{}';
ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'private_admin';
ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS dashboard_label TEXT;
ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS campaign_workspaces_slug_idx ON civic_call.campaign_workspaces (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS campaign_workspaces_active_idx ON civic_call.campaign_workspaces (is_active);

-- Extended plan statuses (surrogate, research, skip)
COMMENT ON COLUMN civic_call.campaign_event_plans.plan_status IS
  'considering|attending|candidate_should_attend|surrogate_should_attend|needs_volunteers|skip|needs_research';

-- Seed named workspaces (idempotent on slug)
INSERT INTO civic_call.campaign_workspaces (
  slug, campaign_name, candidate_name, office_sought, district_type, district_name,
  counties, cities, district_scope, dashboard_theme, dashboard_label, notes,
  is_active, access_mode
) VALUES
(
  'kelly-grappe-sos',
  'Kelly Grappe for Secretary of State',
  'Kelly Grappe',
  'Arkansas Secretary of State',
  'statewide',
  'State of Arkansas',
  '[]'::jsonb,
  '[]'::jsonb,
  '{"mode":"statewide","counties":[],"cities":[],"boundaryPrecision":"full"}'::jsonb,
  '{"primaryColor":"#1B4332","accentColor":"#BC4749","surfaceColor":"#F5F0E6","heroTagline":"Every vote counted. Every community heard.","logoInitials":"KG","badgeLabel":"Secretary of State"}'::jsonb,
  'Kelly Grappe — SOS Command',
  'Statewide scope — all 75 counties. Civic access and election integrity focus.',
  true,
  'private_admin'
),
(
  'chris-jones-ar02',
  'Chris Jones for Congress',
  'Chris Jones',
  'U.S. House of Representatives',
  'congressional',
  'Arkansas Congressional District 2',
  '["Cleburne","Conway","Faulkner","Perry","Saline","Van Buren","White","Pulaski"]'::jsonb,
  '["Little Rock","Conway","North Little Rock","Benton","Malvern"]'::jsonb,
  '{"mode":"congressional","districtCode":"AR-02","counties":["Cleburne","Conway","Faulkner","Perry","Saline","Van Buren","White","Pulaski"],"cities":[],"boundaryPrecision":"pending","boundaryNote":"Pulaski County is partial in AR-02 — GIS pass required"}'::jsonb,
  '{"primaryColor":"#2D6A4F","accentColor":"#40916C","surfaceColor":"#E8F4F0","heroTagline":"Building Arkansas''s future — District 2.","logoInitials":"CJ","badgeLabel":"Congress · AR-02"}'::jsonb,
  'Chris Jones — AR-02 Command',
  'Placeholder county scope from statutory district definition. Partial Pulaski pending boundary engine.',
  true,
  'private_admin'
),
(
  'fred-love-governor',
  'Fred Love for Governor',
  'Fred Love',
  'Governor of Arkansas',
  'statewide',
  'State of Arkansas',
  '[]'::jsonb,
  '[]'::jsonb,
  '{"mode":"statewide","counties":[],"cities":[],"boundaryPrecision":"full"}'::jsonb,
  '{"primaryColor":"#3D405B","accentColor":"#E07A5F","surfaceColor":"#F4F1DE","heroTagline":"Leadership for all Arkansans.","logoInitials":"FL","badgeLabel":"Governor"}'::jsonb,
  'Fred Love — Governor Command',
  'Statewide scope — all Arkansas communities.',
  true,
  'private_admin'
),
(
  'eduardo-guzman-senate',
  'Eduardo Guzman for State Senate',
  'Eduardo Guzman',
  'Arkansas State Senate',
  'state_senate',
  'Arkansas Senate District 27',
  '["Sebastian"]'::jsonb,
  '["Fort Smith"]'::jsonb,
  '{"mode":"state_senate","districtCode":"SD-27","counties":["Sebastian"],"cities":["Fort Smith"],"boundaryPrecision":"pending","boundaryNote":"SD-27 covers part of Sebastian County — precinct-level GIS pending"}'::jsonb,
  '{"primaryColor":"#5C4033","accentColor":"#C1666B","surfaceColor":"#FAF3F0","heroTagline":"Fort Smith''s voice at the Capitol.","logoInitials":"EG","badgeLabel":"State Senate · SD-27"}'::jsonb,
  'Eduardo Guzman — SD-27 Command',
  'Fort Smith / Sebastian placeholder until Senate district GIS loaded.',
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
