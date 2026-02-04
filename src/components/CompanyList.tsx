import { useState, useMemo } from "react";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CompanyData } from "@/types/company";

interface CompanyListProps {
  companies: CompanyData[];
  selectedCompany: CompanyData | null;
  onSelectCompany: (company: CompanyData) => void;
}

export function CompanyList({
  companies,
  selectedCompany,
  onSelectCompany,
}: CompanyListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const query = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.companyId.toLowerCase().includes(query) ||
        c.companyName.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by ID or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-1">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No companies found
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <button
                key={company.companyId}
                onClick={() => onSelectCompany(company)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all duration-200",
                  "hover:bg-accent/80",
                  selectedCompany?.companyId === company.companyId
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card hover:shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-md",
                      selectedCompany?.companyId === company.companyId
                        ? "bg-primary-foreground/20"
                        : "bg-muted"
                    )}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{company.companyName}</p>
                    <p
                      className={cn(
                        "text-xs truncate",
                        selectedCompany?.companyId === company.companyId
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      ID: {company.companyId}
                    </p>
                    <div
                      className={cn(
                        "flex gap-2 mt-1 text-xs",
                        selectedCompany?.companyId === company.companyId
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      <span>Impressions: {formatNumber(company.monthly_impressions)}</span>
                      <span>•</span>
                      <span>p100: {formatNumber(company.p100)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
