import { useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CompanyData } from "@/types/company";

interface AdvancedSettingsProps {
  selectedCompany: CompanyData | null;
}

export function AdvancedSettings({ selectedCompany }: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-foreground">Advanced Details</span>
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
            <p className="text-sm font-medium text-muted-foreground mb-3">Company details</p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">p100</p>
                <p className="font-semibold text-lg">{selectedCompany.p100.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">total_companies_in_cohort</p>
                <p className="font-semibold text-lg">
                  {selectedCompany.total_companies_in_cohort != null
                    ? selectedCompany.total_companies_in_cohort.toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}