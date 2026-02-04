import type { CompanyData, SimulationConfig, MonthlyResult, SimulationResult } from "@/types/company";

// Distribute total ads quantity randomly across 6 months (7-12)
function distributeAdsRandomly(totalAdsQty: number): number[] {
  const weights = Array.from({ length: 6 }, () => Math.random());
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  return weights.map(w => Math.floor((w / totalWeight) * totalAdsQty));
}

export function runSimulation(
  company: CompanyData,
  config: SimulationConfig
): SimulationResult {
  const { boostMultiplier, totalAdsQty, adsCeiling, k } = config;
  const monthlyResults: MonthlyResult[] = [];

  // Pre-compute ads distribution for months 7-12
  const adsDistribution = distributeAdsRandomly(totalAdsQty);

  let prevOrganicImpressions = company.monthly_impressions;

  for (let month = 1; month <= 12; month++) {
    // Apply randomization (0.8 to 1.1)
    const randomFactor = 0.8 + Math.random() * 0.3;
    const organicImpressions = month === 1 
      ? company.monthly_impressions * randomFactor
      : prevOrganicImpressions * randomFactor;

    // Free tier rule: months 1-6 have no boost or ads
    const isFreePhase = month <= 6;
    
    // CHANGE 1: Boost impressions = (multiplier - 1) * organic (incremental only)
    const boostImpressions = isFreePhase ? 0 : (boostMultiplier - 1) * organicImpressions;
    
    // CHANGE 3: Ads from pre-distributed allocation
    const adsImpressions = isFreePhase ? 0 : adsDistribution[month - 7];

    // Calculate scores
    const organicScore = calculateOrganicScore(organicImpressions, k);
    const boostScore = isFreePhase 
      ? 0 
      : calculateBoostScore(organicImpressions, boostImpressions, k);
    const adsScore = isFreePhase 
      ? 0 
      : calculateAdsScore(adsImpressions, adsCeiling);

    // Calculate total score
    const baseScore = organicScore + boostScore;
    const totalScore = isFreePhase 
      ? organicScore 
      : clampScore(0.5 * baseScore + 0.5 * adsScore);

    monthlyResults.push({
      month,
      organicImpressions,
      boostImpressions,
      adsImpressions,
      organicScore: clampScore(organicScore),
      boostScore: clampScore(boostScore),
      adsScore: clampScore(adsScore),
      totalScore: clampScore(totalScore),
    });

    prevOrganicImpressions = organicImpressions;
  }

  return { config, monthlyResults };
}

function calculateOrganicScore(impressions: number, k: number): number {
  return 100 * (1 - Math.exp(-impressions / k));
}

function calculateBoostScore(organicImpressions: number, boostImpressions: number, k: number): number {
  return 100 * Math.exp(-organicImpressions / k) * (1 - Math.exp(-boostImpressions / k));
}

function calculateAdsScore(adsImpressions: number, k_a: number): number {
  return 100 * (1 - Math.exp(-adsImpressions / k_a));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
