import { useState, useCallback, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { CompanyList } from "@/components/CompanyList";
import { ControlPanel } from "@/components/ControlPanel";
import { SimulationChart } from "@/components/SimulationChart";
import { SimulationTable } from "@/components/SimulationTable";
import { runSimulation } from "@/lib/simulation";
import {
  getDefaultAdsCeiling,
  getDefaultBoostMultiplier,
  getDefaultTotalAdsQty,
  type CompanyData,
  type SimulationConfig,
  type SimulationResult,
} from "@/types/company";
import { Activity, TrendingUp } from "lucide-react";

const Index = () => {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [config, setConfig] = useState<SimulationConfig>({
    boostMultiplier: 2.0,
    totalAdsQty: 600000,
    adsCeiling: 1200000,
    k: 10000,
  });
  const [result, setResult] = useState<SimulationResult | null>(null);

  const getDefaultConfig = useCallback((company: CompanyData): SimulationConfig => {
    return {
      boostMultiplier: getDefaultBoostMultiplier(company.monthly_impressions),
      totalAdsQty: getDefaultTotalAdsQty(company.p100),
      adsCeiling: getDefaultAdsCeiling(company.p100),
      k: company.p100,
    };
  }, []);

  const handleDataLoaded = useCallback((data: CompanyData[]) => {
    setCompanies(data);
    setSelectedCompany(null);
    setResult(null);
  }, []);

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

  // Auto-recalculate when config changes
  useEffect(() => {
    if (selectedCompany) {
      setResult(runSimulation(selectedCompany, config));
    }
  }, [config, selectedCompany]);

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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              {companies.length} companies loaded
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
                  <CompanyList
                    companies={companies}
                    selectedCompany={selectedCompany}
                    onSelectCompany={handleSelectCompany}
                  />
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
                  {/* Selected Company Info */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{selectedCompany.companyName}</h2>
                        <p className="text-sm text-muted-foreground">ID: {selectedCompany.companyId}</p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Monthly Impressions</p>
                          <p className="font-semibold text-lg">
                            {selectedCompany.monthly_impressions.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">p90</p>
                          <p className="font-semibold text-lg">{selectedCompany.p90.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">p99</p>
                          <p className="font-semibold text-lg">{selectedCompany.p99.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">p100</p>
                          <p className="font-semibold text-lg">{selectedCompany.p100.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls and Chart */}
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 xl:col-span-4">
                      <ControlPanel
                        config={config}
                        onConfigChange={setConfig}
                        onReset={handleReset}
                        onRecalculate={handleRecalculate}
                      />
                    </div>
                    <div className="col-span-12 xl:col-span-8">
                      {result && <SimulationChart data={result.monthlyResults} />}
                    </div>
                  </div>

                  {/* Results Table */}
                  {result && <SimulationTable data={result.monthlyResults} />}
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
