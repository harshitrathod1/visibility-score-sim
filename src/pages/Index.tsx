import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { FileUpload } from "@/components/FileUpload";
import { CompanyList } from "@/components/CompanyList";
import { SimulationChart } from "@/components/SimulationChart";
import { ScoreCards } from "@/components/ScoreCards";
import { CohortMetricsCard } from "@/components/CohortMetricsCard";
import { MonthlyAveragesCard } from "@/components/MonthlyAveragesCard";
import { TrendTable } from "@/components/TrendTable";
import { AdvancedSettings } from "@/components/AdvancedSettings";
import { runSimulation } from "@/lib/simulation";
import {
  getDefaultAdsCeiling,
  getDefaultBoostMultiplier,
  getDefaultTotalAdsQty,
  normalizeCompanyRow,
  type CompanyData,
  type SimulationConfig,
  type SimulationResult,
  type BenchmarkFile,
} from "@/types/company";
import { Activity, TrendingUp } from "lucide-react";

const DEFAULT_CSV_PATH = "/default-companies.csv";
const DEFAULT_V2_CSV_PATH = "/company_impressions_data_v2.csv";
const DEFAULT_BENCHMARK_PATH = "/benchmarks_v2.json";

/** Company IDs that exist in the benchmark are the only ones we display. */
function companyIdFromRow(row: Record<string, unknown>): string {
  return String(row.companyId ?? row.company_id ?? "").trim();
}

function parseCsvToCompaniesAndRows(csvText: string): {
  companies: CompanyData[];
  rawRows: Record<string, unknown>[];
  skippedRows: number;
} {
  const workbook = XLSX.read(csvText, { type: "string" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  const companies: CompanyData[] = [];
  let skippedRows = 0;
  for (const row of rawRows) {
    const parsed = normalizeCompanyRow(row);
    if ("skip" in parsed) skippedRows++;
    else companies.push(parsed.company);
  }
  return { companies, rawRows, skippedRows };
}

type WorkerMessage =
  | { type: "progress"; processed: number; total: number }
  | { type: "done"; benchmark: BenchmarkFile }
  | { type: "error"; message: string };

const Index = () => {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [config, setConfig] = useState<SimulationConfig>({
    boostMultiplier: 2.0,
    totalAdsQty: 600000,
    adsCeiling: 1200000,
    k: 10000,
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkFile | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkStale, setBenchmarkStale] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const getDefaultConfig = useCallback((company: CompanyData): SimulationConfig => {
    return {
      boostMultiplier: getDefaultBoostMultiplier(company.monthly_impressions),
      totalAdsQty: getDefaultTotalAdsQty(company.p100),
      adsCeiling: getDefaultAdsCeiling(company.p100),
      k: company.p100,
    };
  }, []);

  const handleDataLoaded = useCallback(
    (result: { companies: CompanyData[]; rawRows: Record<string, unknown>[]; skippedRows: number }) => {
      setCompanies(result.companies);
      setRawRows(result.rawRows);
      setSelectedCompany(null);
      setResult(null);
      setBenchmark(null);
      setBenchmarkError(null);
      setBenchmarkStale(false);
      setUploadWarning(
        result.skippedRows > 0
          ? `${result.skippedRows} rows skipped (missing companyId or invalid impressions/p100).`
          : null
      );
      if (result.rawRows.length > 0) {
        setBenchmarkLoading(true);
        const worker = new Worker(
          new URL("@/workers/benchmarkWorker.ts", import.meta.url),
          { type: "module" }
        );
        workerRef.current = worker;
        worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
          const msg = e.data;
          if (msg.type === "progress") return;
          if (msg.type === "done") {
            const b = msg.benchmark;
            setCompanies((prev) => prev.filter((c) => b.companies[c.companyId] != null));
            setRawRows((prev) =>
              prev.filter((r) => b.companies[companyIdFromRow(r)] != null)
            );
            setBenchmark(b);
            setBenchmarkLoading(false);
            setBenchmarkError(null);
          } else {
            setBenchmarkError(msg.message);
            setBenchmarkLoading(false);
          }
          worker.terminate();
          workerRef.current = null;
        };
        worker.onerror = () => {
          setBenchmarkError("Benchmark worker failed");
          setBenchmarkLoading(false);
          workerRef.current = null;
        };
        worker.postMessage({ config, rows: result.rawRows });
      } else {
        setBenchmarkLoading(false);
      }
    },
    [config]
  );

  const handleSelectCompany = useCallback(
    (company: CompanyData) => {
      setSelectedCompany(company);
      const defaultConfig = getDefaultConfig(company);
      setConfig(defaultConfig);
      setResult(runSimulation(company, defaultConfig));
    },
    [getDefaultConfig]
  );

  const handleRecalculate = useCallback(() => {
    if (selectedCompany) {
      setResult(runSimulation(selectedCompany, config));
    }
  }, [selectedCompany, config]);

  const handleReset = useCallback(() => {
    if (selectedCompany) {
      const defaultConfig = getDefaultConfig(selectedCompany);
      setConfig(defaultConfig);
      setResult(runSimulation(selectedCompany, defaultConfig));
    }
  }, [selectedCompany, getDefaultConfig]);

  const handleRegenerateCohort = useCallback(() => {
    if (rawRows.length === 0) return;
    setBenchmarkLoading(true);
    const worker = new Worker(
      new URL("@/workers/benchmarkWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === "progress") return;
      if (msg.type === "done") {
        setBenchmark(msg.benchmark);
        setBenchmarkLoading(false);
        setBenchmarkStale(false);
        setBenchmarkError(null);
      } else {
        setBenchmarkError(msg.message);
        setBenchmarkLoading(false);
      }
      worker.terminate();
      workerRef.current = null;
    };
    worker.onerror = () => {
      setBenchmarkError("Benchmark worker failed");
      setBenchmarkLoading(false);
      workerRef.current = null;
    };
    worker.postMessage({ config, rows: rawRows });
  }, [config, rawRows]);

  // Auto-recalculate when config changes
  useEffect(() => {
    if (selectedCompany) {
      setResult(runSimulation(selectedCompany, config));
    }
  }, [config, selectedCompany]);

  const configChangedRef = useRef(false);
  // Mark benchmark stale when controls change (so user knows to regenerate); skip initial mount
  useEffect(() => {
    if (!configChangedRef.current) {
      configChangedRef.current = true;
      return;
    }
    if (benchmark && !benchmarkLoading) setBenchmarkStale(true);
  }, [config, benchmark, benchmarkLoading]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // All benchmark companies, sorted by cohort avg score descending (highest cohort avg first)
  const displayCompanies = useMemo(() => {
    if (!benchmark || companies.length === 0) return [];
    const list = companies
      .filter((c) => benchmark.companies[c.companyId] != null)
      .map((c) => {
        const b = benchmark.companies[c.companyId];
        const cohort = b.cohortId ? benchmark.cohorts[b.cohortId] : undefined;
        const cohortAvgScore = cohort?.cohortAvgScore1to12 ?? 0;
        return { company: c, cohortAvgScore };
      })
      .sort((a, b) => b.cohortAvgScore - a.cohortAvgScore)
      .map(({ company }) => company);
    if (selectedCompany && !list.some((c) => c.companyId === selectedCompany.companyId)) {
      return [selectedCompany, ...list];
    }
    return list;
  }, [benchmark, companies, selectedCompany]);

  // Load default v2 CSV and benchmarks on first visit; fallback to v1 default if v2 CSV missing
  useEffect(() => {
    let cancelled = false;
    fetch(DEFAULT_V2_CSV_PATH)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("not found"))))
      .then((csvText) => {
        if (cancelled) return null;
        const { companies: parsed, rawRows: rows } = parseCsvToCompaniesAndRows(csvText);
        if (parsed.length > 0) {
          return fetch(DEFAULT_BENCHMARK_PATH)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("benchmark not found"))))
            .then((data: BenchmarkFile) => {
              if (cancelled) return;
              if (data.version === "v2" && data.companies && data.cohorts) {
                const inBenchmark = (c: CompanyData) => data.companies[c.companyId] != null;
                setCompanies(parsed.filter(inBenchmark));
                setRawRows(rows.filter((r) => data.companies[companyIdFromRow(r)] != null));
                setBenchmark(data);
                setBenchmarkError(null);
                setBenchmarkStale(false);
              } else {
                setCompanies(parsed);
                setRawRows(rows);
                setBenchmarkError("Cohort benchmarks unavailable for default dataset.");
              }
            })
            .catch(() => {
              if (!cancelled) {
                setCompanies(parsed);
                setRawRows(rows);
                setBenchmarkError("Cohort benchmarks unavailable for default dataset.");
              }
            });
        }
        return null;
      })
      .catch(() => {
        if (cancelled) return;
        fetch(DEFAULT_CSV_PATH)
          .then((r) => (r.ok ? r.text() : Promise.reject(new Error("Default data not found"))))
          .then((csvText) => {
            if (cancelled) return;
            const { companies: parsed, rawRows: rows } = parseCsvToCompaniesAndRows(csvText);
            if (parsed.length > 0) {
              setCompanies(parsed);
              setRawRows(rows);
            }
          })
          .catch(() => {});
        setBenchmarkError("Cohort benchmarks unavailable for default dataset.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Visibility Score Simulator</h1>
              <p className="text-xs text-muted-foreground">Analyze company visibility metrics</p>
            </div>
          </div>
          {companies.length > 0 && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                {benchmark
                  ? `${displayCompanies.length} companies`
                  : `${companies.length} companies loaded`}
              </div>
              {uploadWarning && (
                <p className="text-xs text-amber-600 dark:text-amber-500">{uploadWarning}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="container px-4 py-6">
        {companies.length === 0 ? (
          /* Upload State */
          <div className="max-w-2xl mx-auto pt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Get Started</h2>
              <p className="text-muted-foreground">
                Upload your company data to simulate visibility scores
              </p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} hasData={false} />
          </div>
        ) : (
          /* Main Dashboard */
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Company List */}
            <aside className="col-span-12 lg:col-span-3">
              <div className="sticky top-24 space-y-4">
                <FileUpload onDataLoaded={handleDataLoaded} hasData={true} />
                <div className="bg-card border border-border rounded-lg p-4 h-[500px]">
                  {benchmark ? (
                    <CompanyList
                      companies={displayCompanies}
                      selectedCompany={selectedCompany}
                      onSelectCompany={handleSelectCompany}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm px-4">
                      {benchmarkLoading ? (
                        <>
                          <Activity className="w-8 h-8 animate-pulse mb-2" />
                          <p>Calculating benchmarks…</p>
                          <p className="mt-1">{companies.length} companies loaded. List will show all when ready.</p>
                        </>
                      ) : (
                        <p>Load data to see companies (all shown once benchmarks are ready).</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Right Content - Controls & Visualization */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              {!selectedCompany ? (
                <div className="flex flex-col items-center justify-center h-[600px] bg-card border border-border rounded-lg">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <TrendingUp className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Select a Company</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Choose a company from the list to run the visibility score simulation
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Selected Company Info - Company Name and ID only */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{selectedCompany.companyName}</h2>
                        <p className="text-sm text-muted-foreground">ID: {selectedCompany.companyId}</p>
                      </div>
                    </div>
                  </div>

                   {/* Score Cards */}
                   {result && <ScoreCards monthlyResults={result.monthlyResults} />}

                   {/* Cohort metrics (percentile, company avg, cohort avg) */}
                   {result && selectedCompany && (
                     <CohortMetricsCard
                       companyAvgScore1to12={
                         benchmark?.companies[selectedCompany.companyId]?.avgScore1to12
                       }
                       cohortAvgScore1to12={
                         selectedCompany.cohort_id && benchmark?.cohorts[selectedCompany.cohort_id]
                           ? benchmark.cohorts[selectedCompany.cohort_id].cohortAvgScore1to12
                           : undefined
                       }
                       percentileRankM12={
                         benchmark?.companies[selectedCompany.companyId]?.percentileRankM12
                       }
                       benchmarkUnavailable={benchmarkError != null}
                     />
                   )}

                   {/* Monthly Averages */}
                   {result && <MonthlyAveragesCard monthlyResults={result.monthlyResults} />}

                   {/* Chart */}
                   {result && (
                     <SimulationChart
                       data={result.monthlyResults}
                       cohortAvgMonthlyScore={
                         selectedCompany?.cohort_id && benchmark?.cohorts[selectedCompany.cohort_id]
                           ? benchmark.cohorts[selectedCompany.cohort_id].cohortAvgMonthlyScore
                           : undefined
                       }
                     />
                   )}

                   {/* Trend Table */}
                   {result && <TrendTable monthlyResults={result.monthlyResults} />}

                   {/* Advanced Settings (includes p90, p99, p100 view) */}
                   <AdvancedSettings
                     config={config}
                     onConfigChange={setConfig}
                     onReset={handleReset}
                     onRecalculate={handleRecalculate}
                     onRegenerateCohort={handleRegenerateCohort}
                     benchmarkLoading={benchmarkLoading}
                     benchmarkStale={benchmarkStale}
                     selectedCompany={selectedCompany}
                   />
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
