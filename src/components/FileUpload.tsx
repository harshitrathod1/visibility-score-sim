import { useCallback } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompanyData } from "@/types/company";

interface FileUploadProps {
  onDataLoaded: (data: CompanyData[]) => void;
  hasData: boolean;
}

export function FileUpload({ onDataLoaded, hasData }: FileUploadProps) {
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

          const companies: CompanyData[] = jsonData.map((row) => ({
            companyId: String(row.companyId || row.company_id || ""),
            companyName: String(row.companyName || row.company_name || ""),
            monthly_impressions: Number(row.monthly_impressions) || 0,
            p90: Number(row.p90) || 0,
            p99: Number(row.p99) || 0,
            p100: Number(row.p100) || 0,
          }));

          onDataLoaded(companies);
        } catch (error) {
          console.error("Error parsing file:", error);
        }
      };
      reader.readAsBinaryString(file);
    },
    [onDataLoaded]
  );

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-card transition-colors hover:border-primary/50">
      <div className="flex flex-col items-center gap-4">
        {hasData ? (
          <FileSpreadsheet className="w-12 h-12 text-primary" />
        ) : (
          <Upload className="w-12 h-12 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {hasData ? "File loaded successfully" : "Upload Excel or CSV file"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Required columns: companyId, companyName, monthly_impressions, p90, p99, p100
          </p>
        </div>
        <Button variant="outline" className="relative" asChild>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {hasData ? "Upload New File" : "Select File"}
          </label>
        </Button>
      </div>
    </div>
  );
}
