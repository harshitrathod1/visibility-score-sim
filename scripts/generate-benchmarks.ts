/**
 * Generates public/benchmarks_v2.json from company_impressions_data_v2.csv.
 * Run from repo root: npm run bench:generate (or npx tsx scripts/generate-benchmarks.ts)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";
import { generateBenchmarks } from "../src/lib/benchmark";
import type { SimulationConfig } from "../src/types/company";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const csvPath =
  fs.existsSync(path.join(root, "company_impressions_data_v2.csv"))
    ? path.join(root, "company_impressions_data_v2.csv")
    : path.join(publicDir, "company_impressions_data_v2.csv");
const benchmarkPath = path.join(publicDir, "benchmarks_v2.json");
const publicCsvPath = path.join(publicDir, "company_impressions_data_v2.csv");

const defaultConfig: SimulationConfig = {
  boostMultiplier: 2.0,
  totalAdsQty: 600_000,
  adsCeiling: 1_200_000,
  k: 35_000,
};

function main() {
  if (!fs.existsSync(csvPath)) {
    console.error("Missing company_impressions_data_v2.csv at repo root or public/.");
    process.exit(1);
  }

  const buf = fs.readFileSync(csvPath);
  const workbook = XLSX.read(buf, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  console.log(`Parsed ${rows.length} rows. Generating benchmarks...`);
  const benchmark = generateBenchmarks(rows, defaultConfig, (processed, total) => {
    if (processed % 2000 === 0 || processed === total) {
      console.log(`  ${processed}/${total}`);
    }
  });

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(benchmarkPath, JSON.stringify(benchmark, null, 2), "utf-8");
  console.log(`Wrote ${benchmarkPath}`);

  // Optional: show organic vs total cohort avg for one cohort (explains why cohort avg looks low)
  if (process.env.DEBUG_COHORT_AVG === "1") {
    const firstCohortId = Object.keys(benchmark.cohorts)[0];
    if (firstCohortId) {
      const c = benchmark.cohorts[firstCohortId];
      const avgOrganic = c.cohortAvgScore1to12;
      const monthlyOrganic = c.cohortAvgMonthlyScore;
      console.log(`\n[DEBUG] First cohort "${firstCohortId}" (size ${c.cohortSize}):`);
      console.log(`  Cohort avg (organic) 1-12: ${avgOrganic.toFixed(2)}`);
      console.log(`  Cohort avg (organic) by month: [${monthlyOrganic.map((v) => v.toFixed(1)).join(", ")}]`);
      console.log(`  (Cohort avg using total score would be higher; we use organic only.)`);
    }
  }

  if (!fs.existsSync(publicCsvPath)) {
    fs.copyFileSync(csvPath, publicCsvPath);
    console.log(`Copied CSV to ${publicCsvPath}`);
  }
}

main();
