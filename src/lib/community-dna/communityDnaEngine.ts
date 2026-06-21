import cityBundle from "../../../data/community-dna/city-community-dna.json";
import countyBundle from "../../../data/community-dna/county-community-dna.json";
import scoresBundle from "../../../data/community-dna/county-calendar-dna-scores.json";
import guideRegistry from "../../../data/community-systems/discovery-guide-registry.json";
import type { CityCommunityDna, CountyCalendarDnaScore, CountyCommunityDna } from "./communityDnaTypes";

const cities = (cityBundle.cities ?? []) as CityCommunityDna[];
const counties = (countyBundle.counties ?? []) as CountyCommunityDna[];
const scores = (scoresBundle.scores ?? []) as CountyCalendarDnaScore[];

export function getCityCommunityDna(city: string): CityCommunityDna | null {
  return cities.find((c) => c.city.toLowerCase() === city.toLowerCase()) ?? null;
}

export function getCountyCommunityDna(county: string): CountyCommunityDna | null {
  return counties.find((c) => c.county.toLowerCase() === county.toLowerCase()) ?? null;
}

export function getCountyCalendarDnaScore(county: string): CountyCalendarDnaScore | null {
  return scores.find((s) => s.county.toLowerCase() === county.toLowerCase()) ?? null;
}

export function allCountyCalendarDnaScores(): CountyCalendarDnaScore[] {
  return scores;
}

export interface DiscoveryGuideEntry {
  id: string;
  slug: string;
  title: string;
  path: string;
  laneIds?: string[];
  filters?: string[];
  faqJsonLd?: boolean;
  generation?: string;
  windowDays?: number;
  countyTarget?: number;
}

export function listDiscoveryGuides(): DiscoveryGuideEntry[] {
  return (guideRegistry.guides ?? []) as DiscoveryGuideEntry[];
}

export function getDiscoveryGuide(slug: string): DiscoveryGuideEntry | null {
  return listDiscoveryGuides().find((g) => g.slug === slug || g.id === slug) ?? null;
}

export interface CommunityDnaHealth {
  cityCount: number;
  countyCount: number;
  scoreCount: number;
  thinCounties: number;
  strongCounties: number;
  guideCount: number;
  avgScore: number;
}

export function runCommunityDnaHealth(): CommunityDnaHealth {
  const thin = scores.filter((s) => s.total_score < 45).length;
  const strong = scores.filter((s) => s.total_score >= 70).length;
  const avg = scores.length ? Math.round(scores.reduce((a, s) => a + s.total_score, 0) / scores.length) : 0;
  return {
    cityCount: cities.length,
    countyCount: counties.length,
    scoreCount: scores.length,
    thinCounties: thin,
    strongCounties: strong,
    guideCount: listDiscoveryGuides().length,
    avgScore: avg,
  };
}
