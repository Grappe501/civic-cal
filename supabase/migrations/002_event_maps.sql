-- Arkansas Everywhere — map / geocoding columns (non-destructive)
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS formatted_address TEXT;
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS location_confidence TEXT;
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS map_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'AR';
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS is_online_only BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS events_map_status_idx ON civic_call.events (map_status);
CREATE INDEX IF NOT EXISTS events_lat_lng_idx ON civic_call.events (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
