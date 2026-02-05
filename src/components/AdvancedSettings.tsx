import { useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ControlPanel } from "@/components/ControlPanel";
import type { CompanyData, SimulationConfig } from "@/types/company";

interface AdvancedSettingsProps {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
  onReset: () => void;
  onRecalculate: () => void;
  selectedCompany: CompanyData | null;
}

export function AdvancedSettings({
  config,
  onConfigChange,
  onReset,
  onRecalculate,
  selectedCompany,
}: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-foreground">Advanced Settings</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-4">
        {selectedCompany && (
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Company metrics (p90, p99, p100)</p>
            <div className="flex flex-wrap gap-6 text-sm">
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
        )}
        <ControlPanel
          config={config}
          onConfigChange={onConfigChange}
          onReset={onReset}
          onRecalculate={onRecalculate}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}