import { ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { MonthlyResult } from "@/types/company";

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface TrendTableProps {
  monthlyResults: MonthlyResult[];
}

export function TrendTable({ monthlyResults }: TrendTableProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    if (num === 0) return "0";
    return num.toFixed(0);
  };

  const rows = [
    {
      label: "Organic",
      values: monthlyResults.map((r) => r.organicImpressions),
      className: "text-[hsl(var(--chart-organic))]",
    },
    {
      label: "Boosted",
      values: monthlyResults.map((r) => r.boostImpressions),
      className: "text-[hsl(var(--chart-boost))]",
    },
    {
      label: "Ads",
      values: monthlyResults.map((r) => r.adsImpressions),
      className: "text-[hsl(var(--chart-ads))]",
    },
    {
      label: "Total Score",
      values: monthlyResults.map((r) => r.totalScore),
      className: "font-semibold",
    },
  ];

  const totalScores = monthlyResults.map((r) => r.totalScore);
  const isPaidTierDrop = (index: number) => {
    if (index < 6) return false;
    const prev = totalScores[index - 1];
    const curr = totalScores[index];
    return prev != null && curr != null && curr < prev;
  };

  const getTotalScoreCellClass = (monthIndex: number) => {
    const isFreeTier = monthIndex < 6;
    const base = "text-center text-sm font-semibold";
    if (isFreeTier) return `${base} text-[hsl(var(--chart-organic))]`;
    return `${base} text-[hsl(var(--chart-total))]`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">12-Month Trend</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-24 text-muted-foreground font-medium">
                    Months
                  </TableHead>
                  {monthlyResults.map((_, i) => (
                    <TableHead
                      key={i}
                      className="text-center text-muted-foreground font-medium min-w-[60px]"
                    >
                      {SHORT_MONTHS[i] ?? `M${i + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      {row.label}
                    </TableCell>
                    {row.values.map((value, i) => (
                      <TableCell
                        key={i}
                        className={
                          row.label === "Total Score"
                            ? getTotalScoreCellClass(i)
                            : `text-center text-sm ${row.className}`
                        }
                      >
                        {row.label === "Total Score" ? (
                          <span className="inline-flex items-center gap-0.5">
                            {value.toFixed(1)}
                            {isPaidTierDrop(i) && (
                              <ArrowDown className="w-3.5 h-3.5 text-destructive shrink-0" aria-label="Score dropped" />
                            )}
                          </span>
                        ) : (
                          formatNumber(value)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}