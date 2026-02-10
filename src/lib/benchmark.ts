import { runSimulation, createSeededRng } from "@/lib/simulation";
import type {
  CompanyData,
  SimulationConfig,
  BenchmarkFile,
  CompanyBenchmark,
  CohortBenchmark,
} from "@/types/company";
import { normalizeCompanyRow } from "@/types/company";

const PROGRESS_BATCH = 500;

function simpleConfigHash(config: SimulationConfig): string {
  return [
    config.boostMultiplier,
    config.totalAdsQty,
    config.adsCeiling,
    config.k,
  ].join("|");
}

export function generateBenchmarks(
  rows: Record<string, unknown>[],
  config: SimulationConfig,
  onProgress?: (processed: number, total: number) => void
): BenchmarkFile {
  const configHash = simpleConfigHash(config);
  const companies: Record<string, CompanyBenchmark> = {};
  const cohortScores: Record<
    string,
    {
      month12: number[];
      avg1to12: number[];
      monthlySeries: number[][];
      monthlyOrganicSeries: number[][];
      avgOrganic1to12: number[];
      expectedSize: number;
    }
  > = {};
  const cohortExpectedSize: Record<string, number> = {};
  let validCount = 0;
  let skippedCount = 0;

  const validCompanies: CompanyData[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = normalizeCompanyRow(rows[i]);
    if ("skip" in parsed) {
      skippedCount++;
      if (onProgress && (i + 1) % PROGRESS_BATCH === 0) {
        onProgress(i + 1, rows.length);
      }
      continue;
    }
    validCompanies.push(parsed.company);
    validCount++;
    if (onProgress && validCount % PROGRESS_BATCH === 0) {
      onProgress(i + 1, rows.length);
    }
  }

  if (onProgress) onProgress(rows.length, rows.length);

  for (const company of validCompanies) {
    const rng = createSeededRng(company.companyId + configHash);
    const perCompanyConfig: SimulationConfig = {
      ...config,
      k: company.p100,
    };
    const result = runSimulation(company, perCompanyConfig, rng);
    const month12Score = result.monthlyResults[11].totalScore;
    const monthlySeries = result.monthlyResults.map((r) => r.totalScore);
    const avgScore1to12 =
      monthlySeries.reduce((a, b) => a + b, 0) / 12;

    const monthlyOrganicSeries = result.monthlyResults.map((r) => r.organicScore);
    const avgOrganic1to12 =
      monthlyOrganicSeries.reduce((a, b) => a + b, 0) / 12;

    const cohortId = company.cohort_id || `_no_cohort_${company.companyId}`;
    if (!cohortScores[cohortId]) {
      cohortScores[cohortId] = {
        month12: [],
        avg1to12: [],
        monthlySeries: [],
        monthlyOrganicSeries: [],
        avgOrganic1to12: [],
        expectedSize: 0,
      };
    }
    cohortScores[cohortId].month12.push(month12Score);
    cohortScores[cohortId].avg1to12.push(avgScore1to12);
    cohortScores[cohortId].monthlySeries.push(monthlySeries);
    cohortScores[cohortId].monthlyOrganicSeries.push(monthlyOrganicSeries);
    cohortScores[cohortId].avgOrganic1to12.push(avgOrganic1to12);
    if (
      company.total_companies_in_cohort != null &&
      company.total_companies_in_cohort > 0
    ) {
      cohortExpectedSize[cohortId] = company.total_companies_in_cohort;
    }

    companies[company.companyId] = {
      cohortId,
      month12Score,
      avgScore1to12,
      percentileRankM12: 0,
    };
  }

  for (const cohortId of Object.keys(cohortScores)) {
    const data = cohortScores[cohortId];
    const sortedM12 = [...data.month12].sort((a, b) => a - b);
    const n = sortedM12.length;
    for (const company of validCompanies) {
      if ((company.cohort_id || `_no_cohort_${company.companyId}`) !== cohortId)
        continue;
      const cb = companies[company.companyId];
      if (!cb) continue;
      const s = cb.month12Score;
      const count = sortedM12.filter((x) => x <= s).length;
      cb.percentileRankM12 = n > 0 ? (100 * count) / n : 0;
    }
  }

  // Cohort averages: cohortAvgMonthlyScore uses organic only; cohortAvgScore1to12 uses total (organic + boost + ads).
  // Formula: for each month i, cohortAvgMonthlyScore[i] = (1/m) * sum over companies of organicScore[i].
  // cohortAvgScore1to12 = (1/m) * sum over companies of (mean of their 12 total scores). Used in metrics card.
  const cohorts: Record<string, CohortBenchmark> = {};
  for (const [cid, data] of Object.entries(cohortScores)) {
    if (cid.startsWith("_no_cohort_")) continue;
    const m = data.monthlyOrganicSeries.length;
    const cohortAvgMonthlyScore =
      m === 0
        ? Array.from({ length: 12 }, () => 0)
        : Array.from({ length: 12 }, (_, i) => {
            const sum = data.monthlyOrganicSeries.reduce((s, arr) => s + arr[i], 0);
            return sum / m;
          });
    const cohortAvgScore1to12 =
      m === 0 ? 0 : data.avg1to12.reduce((a, b) => a + b, 0) / m;

    // Validation: (1) formula correctness, (2) organic avg <= total avg (sanity)
    if (m > 0 && process.env.NODE_ENV !== "production") {
      const recomputedMonthly = Array.from({ length: 12 }, (_, i) => {
        const sum = data.monthlyOrganicSeries.reduce((s, arr) => s + arr[i], 0);
        return sum / m;
      });
      const recomputed1to12 = data.avg1to12.reduce((a, b) => a + b, 0) / m;
      const monthlyMatch = recomputedMonthly.every((v, i) => Math.abs(v - cohortAvgMonthlyScore[i]) < 1e-10);
      const avgMatch = Math.abs(recomputed1to12 - cohortAvgScore1to12) < 1e-10;
      if (!monthlyMatch || !avgMatch) {
        console.warn("[benchmark] Cohort avg formula validation failed for", cid, { monthlyMatch, avgMatch });
      }
      const cohortAvgMonthlyTotal = Array.from({ length: 12 }, (_, i) => {
        const sum = data.monthlySeries.reduce((s, arr) => s + arr[i], 0);
        return sum / m;
      });
      const organicLeqTotal = cohortAvgMonthlyScore.every((v, i) => v <= cohortAvgMonthlyTotal[i] + 1e-10);
      if (!organicLeqTotal) {
        console.warn("[benchmark] Sanity check failed: cohort organic avg should be <= cohort total avg", cid);
      }
    }

    cohorts[cid] = {
      cohortSize: m,
      expectedCohortSize: cohortExpectedSize[cid] ?? m,
      cohortAvgMonthlyScore,
      cohortAvgScore1to12,
    };
  }

  return {
    version: "v2",
    generatedAt: new Date().toISOString(),
    configHash,
    summary: {
      inputRows: rows.length,
      validRows: validCount,
      skippedRows: skippedCount,
      cohortCount: Object.keys(cohorts).length,
    },
    companies,
    cohorts,
  };
}
