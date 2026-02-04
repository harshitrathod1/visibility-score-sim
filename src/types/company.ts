export interface CompanyData {
  companyId: string;
  companyName: string;
  monthly_impressions: number;
  p90: number;
  p99: number;
  p100: number;
}

export interface SimulationConfig {
  boostMultiplier: number;
  monthlyAds: number;
  adsCeiling: number;
  k: number;
}

export interface MonthlyResult {
  month: number;
  organicImpressions: number;
  boostImpressions: number;
  adsImpressions: number;
  organicScore: number;
  boostScore: number;
  adsScore: number;
  totalScore: number;
}

export interface SimulationResult {
  config: SimulationConfig;
  monthlyResults: MonthlyResult[];
}

export function getDefaultAdsCeiling(p100: number): number {
  if (p100 < 10000) return 600000;
  if (p100 <= 50000) return 1200000;
  return 2000000;
}

export function getDefaultBoostMultiplier(monthlyImpressions: number): number {
  if (monthlyImpressions < 10000) return 3.0;
  if (monthlyImpressions <= 50000) return 2.0;
  return 1.2;
}
