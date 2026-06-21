-- Joshua Irby — State Senate District 16 (Saline / western Pulaski)

INSERT INTO civic_call.campaign_workspaces (
  slug, campaign_name, candidate_name, office_sought, district_type, district_name,
  counties, cities, district_scope, dashboard_theme, dashboard_label, notes,
  is_active, access_mode
) VALUES (
  'joshua-irby-sd16',
  'Joshua Irby for State Senate',
  'Joshua Irby',
  'Arkansas State Senate',
  'state_senate',
  'Arkansas Senate District 16',
  '["Saline","Pulaski"]'::jsonb,
  '["Benton","Bryant","Alexander","Mabelvale"]'::jsonb,
  '{"mode":"state_senate","districtCode":"SD-16","counties":["Saline","Pulaski"],"cities":["Benton","Bryant"],"boundaryPrecision":"pending","boundaryNote":"SD-16 is central Saline (Benton, Bryant) plus western Pulaski — precinct GIS pending"}'::jsonb,
  '{"primaryColor":"#1E3A5F","accentColor":"#C9A227","surfaceColor":"#F0F4F8","heroTagline":"Respect. Resolve. Renewal. — every voice in District 16.","logoInitials":"JI","badgeLabel":"State Senate · SD-16"}'::jsonb,
  'Joshua Irby — SD-16 Command',
  'Saline County base (Bryant). Democratic nominee SD-16 2026.',
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
