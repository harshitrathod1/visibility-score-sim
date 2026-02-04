import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonthlyResult } from "@/types/company";

interface SimulationTableProps {
  data: MonthlyResult[];
}

export function SimulationTable({ data }: SimulationTableProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-chart-ads font-semibold";
    if (score >= 60) return "text-chart-boost font-medium";
    if (score >= 40) return "text-chart-organic font-medium";
    return "text-muted-foreground";
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TableIcon className="w-5 h-5 text-primary" />
          Monthly Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="font-semibold text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-chart-organic" />
                    Organic
                  </span>
                </TableHead>
                <TableHead className="font-semibold text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-chart-boost" />
                    Boost
                  </span>
                </TableHead>
                <TableHead className="font-semibold text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-chart-ads" />
                    Ads
                  </span>
                </TableHead>
                <TableHead className="font-semibold text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-chart-total" />
                    Total
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.month}
                  className={cn(
                    "transition-colors",
                    row.month <= 6 && "bg-muted/20"
                  )}
                >
                  <TableCell className="font-medium">
                    {row.month}
                    {row.month <= 6 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Free)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-right", getScoreColor(row.organicScore))}>
                    {row.organicScore.toFixed(1)}
                  </TableCell>
                  <TableCell className={cn("text-right", getScoreColor(row.boostScore))}>
                    {row.boostScore.toFixed(1)}
                  </TableCell>
                  <TableCell className={cn("text-right", getScoreColor(row.adsScore))}>
                    {row.adsScore.toFixed(1)}
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", getScoreColor(row.totalScore))}>
                    {row.totalScore.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
