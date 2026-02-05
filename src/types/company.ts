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
  totalAdsQty: number;
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

// 10-divisible values for Total Ads Quantity (6 months) per tier - e.g. 200, 2000, 200000
const ADS_QTY_OPTIONS_TIER1 = [200_000, 300_000, 400_000, 500_000, 600_000]; // p100 < 10k, k_a = 6L
const ADS_QTY_OPTIONS_TIER2 = [400_000, 600_000, 800_000, 1_000_000, 1_200_000]; // 10k–50k, k_a = 12L
const ADS_QTY_OPTIONS_TIER3 = [1_000_000, 1_200_000, 1_600_000, 2_000_000]; // >50k, k_a = 20L

export function getDefaultTotalAdsQty(p100: number): number {
  const options =
    p100 < 10000
      ? ADS_QTY_OPTIONS_TIER1
      : p100 <= 50000
        ? ADS_QTY_OPTIONS_TIER2
        : ADS_QTY_OPTIONS_TIER3;
  return options[Math.floor(Math.random() * options.length)];
}
