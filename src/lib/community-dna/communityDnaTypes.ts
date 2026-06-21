export interface CommunityDnaPeople {
  population?: number;
  median_age?: number;
  age_under_18_pct?: number;
  age_65_plus_pct?: number;
  median_household_income?: number;
  educational_attainment_bachelors_plus_pct?: number;
  unemployment_rate?: number;
  labor_force_participation?: number;
  source_vintage?: string;
  census_url?: string | null;
  age_profile?: string | null;
  education_profile?: string | null;
  demographics_summary?: string | null;
  demographics?: Record<string, unknown>;
}

export interface CommunityDnaPersonality {
  tags: string[];
  summary: string;
  confidence?: number;
}

export interface CityCommunityDna {
  city: string;
  county: string;
  region: string;
  priority_rank?: number;
  people: CommunityDnaPeople;
  institutions: Record<string, unknown>;
  traditions: Record<string, unknown>;
  economy: Record<string, unknown>;
  personality: CommunityDnaPersonality;
  source_links?: { label: string; url: string; type?: string }[];
}

export interface CountyCommunityDna {
  county: string;
  region: string;
  people: CommunityDnaPeople;
  institutions: Record<string, unknown>;
  traditions: Record<string, unknown>;
  economy: Record<string, unknown>;
  personality: CommunityDnaPersonality;
  feeder_city_count?: number;
  source_links?: { label: string; url: string; type?: string }[];
}

export interface CountyCalendarDnaScore {
  county: string;
  population: number;
  public_events: number;
  total_score: number;
  dimensions: Record<string, { score: number; band: string; thin: boolean }>;
  thin_dimensions: string[];
}
