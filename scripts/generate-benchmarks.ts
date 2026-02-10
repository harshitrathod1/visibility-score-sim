/**
 * Generates public/benchmarks_v2.json from company impression CSV/XLSX.
 * Run from repo root: npm run bench:generate
 * Or with a specific file: npx tsx scripts/generate-benchmarks.ts "path/to/data.csv"
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
const defaultCsvPath =
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

function loadRows(inputPath: string): Record<string, unknown>[] {
  const isCsv = inputPath.toLowerCase().endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(fs.readFileSync(inputPath, "utf-8"), { type: "string" })
    : XLSX.read(fs.readFileSync(inputPath), { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
}

function main() {
  const inputPath = process.argv[2]
    ? path.isAbsolute(process.argv[2])
      ? process.argv[2]
      : path.join(root, process.argv[2])
    : defaultCsvPath;

  if (!fs.existsSync(inputPath)) {
    console.error(`Missing input file: ${inputPath}`);
    process.exit(1);
  }

  const rows = loadRows(inputPath);

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
  if (inputPath !== defaultCsvPath) {
    fs.copyFileSync(inputPath, publicCsvPath);
    console.log(`Wrote ${publicCsvPath} from input`);
  }

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
}

main();
