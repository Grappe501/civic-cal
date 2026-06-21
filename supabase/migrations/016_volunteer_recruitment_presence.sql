-- Pass 17: Volunteer Recruitment Presence Layer

ALTER TABLE civic_call.campaign_event_plans
  ADD COLUMN IF NOT EXISTS advertise_volunteers BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS volunteer_signup_url TEXT,
  ADD COLUMN IF NOT EXISTS mobilize_event_url TEXT,
  ADD COLUMN IF NOT EXISTS volunteer_badge_label TEXT,
  ADD COLUMN IF NOT EXISTS volunteer_badge_color TEXT,
  ADD COLUMN IF NOT EXISTS volunteer_needed_count INTEGER,
  ADD COLUMN IF NOT EXISTS volunteer_role_summary TEXT,
  ADD COLUMN IF NOT EXISTS volunteer_shift_notes TEXT;

ALTER TABLE civic_call.campaign_workspaces
  ADD COLUMN IF NOT EXISTS default_volunteer_signup_url TEXT,
  ADD COLUMN IF NOT EXISTS mobilize_org_url TEXT,
  ADD COLUMN IF NOT EXISTS volunteer_brand_color TEXT,
  ADD COLUMN IF NOT EXISTS volunteer_badge_label TEXT;

COMMENT ON COLUMN civic_call.campaign_event_plans.advertise_volunteers IS
  'When true, public calendar shows volunteer recruitment badge for this event';
