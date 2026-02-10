import { useCallback } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeCompanyRow, type CompanyData } from "@/types/company";

export interface FileUploadResult {
  companies: CompanyData[];
  rawRows: Record<string, unknown>[];
  skippedRows: number;
}

interface FileUploadProps {
  onDataLoaded: (result: FileUploadResult) => void;
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
          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

          const companies: CompanyData[] = [];
          let skippedRows = 0;
          for (const row of rawRows) {
            const parsed = normalizeCompanyRow(row);
            if ("skip" in parsed) skippedRows++;
            else companies.push(parsed.company);
          }

          onDataLoaded({ companies, rawRows, skippedRows });
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
            Required: companyId, impressions (monthly_impressions or avg_monthly_impressions), p100. Optional: cohort_id, pi, iec_range, piName
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
