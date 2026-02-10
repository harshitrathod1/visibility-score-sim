export interface CompanyData {
  companyId: string;
  companyName: string;
  monthly_impressions: number;
  p90: number;
  p99: number;
  p100: number;
  /** Present when parsed from v2 or when cohort_id is available */
  cohort_id?: string;
  /** From v2 column total_companies_in_cohort (for benchmark expectedCohortSize) */
  total_companies_in_cohort?: number;
}

/** Raw row from v2 CSV (pi, piName, iec_range, cohort_id, companyId, avg_monthly_impressions, p99, p100, total_companies_in_cohort) */
export interface CompanyInputRowV2 {
  pi?: number;
  piName?: string;
  iec_range?: string;
  cohort_id?: string;
  companyId: string;
  avg_monthly_impressions?: number;
  p99?: number;
  p100?: number;
  total_companies_in_cohort?: number;
}

export interface CompanyBenchmark {
  cohortId: string;
  month12Score: number;
  avgScore1to12: number;
  percentileRankM12: number;
}

export interface CohortBenchmark {
  cohortSize: number;
  expectedCohortSize: number;
  cohortAvgMonthlyScore: number[];
  cohortAvgScore1to12: number;
}

export interface BenchmarkSummary {
  inputRows: number;
  validRows: number;
  skippedRows: number;
  cohortCount: number;
}

export interface BenchmarkFile {
  version: string;
  generatedAt: string;
  configHash: string;
  summary: BenchmarkSummary;
  companies: Record<string, CompanyBenchmark>;
  cohorts: Record<string, CohortBenchmark>;
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

/** Normalize a raw record (v1 or v2) to CompanyData. Returns null if row should be skipped. */
export function normalizeCompanyRow(
  row: Record<string, unknown>
): { company: CompanyData } | { skip: true } {
  const companyId = String(row.companyId ?? row.company_id ?? "").trim();
  if (!companyId) return { skip: true };

  const monthlyImpressions = Number(
    row.avg_monthly_impressions ?? row.monthly_impressions ?? 0
  );
  const p100Val = Number(row.p100 ?? 0);
  if (monthlyImpressions <= 0 || p100Val <= 0) return { skip: true };

  const companyName = String(
    row.companyName ?? row.company_name ?? row.piName ?? companyId
  );
  const p90 = Number(row.p90 ?? 0);
  const p99 = Number(row.p99 ?? 0);
  const iecRange = String(row.iec_range ?? "");
  const pi = row.pi != null ? String(row.pi) : "";
  const cohortId = String(
    row.cohort_id ?? (iecRange && pi ? `${iecRange}_${pi}` : "")
  ).trim();
  const totalCompaniesInCohort = Number(row.total_companies_in_cohort ?? 0);

  const company: CompanyData = {
    companyId,
    companyName,
    monthly_impressions: monthlyImpressions,
    p90,
    p99,
    p100: p100Val,
  };
  if (cohortId) company.cohort_id = cohortId;
  if (totalCompaniesInCohort > 0) company.total_companies_in_cohort = totalCompaniesInCohort;
  return { company };
}
