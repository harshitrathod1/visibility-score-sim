import { ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { MonthlyResult } from "@/types/company";
import { getLast12MonthLabels } from "@/lib/utils";

interface TrendTableV2Props {
  monthlyResults: MonthlyResult[];
  cohortAvgMonthlyScore?: number[];
}

export function TrendTableV2({ monthlyResults, cohortAvgMonthlyScore }: TrendTableV2Props) {
  const monthLabels = getLast12MonthLabels();
  const totalScores = monthlyResults.map((r) => r.totalScore);

  const isPaidTierDrop = (index: number) => {
    if (index < 6) return false;
    const prev = totalScores[index - 1];
    const curr = totalScores[index];
    return prev != null && curr != null && curr < prev;
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
                      {monthLabels[i] ?? `M${i + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">
                    Total Score
                  </TableCell>
                  {totalScores.map((value, i) => (
                    <TableCell
                      key={i}
                      className="text-center text-sm font-semibold text-[hsl(var(--chart-total))]"
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {value.toFixed(1)}
                        {isPaidTierDrop(i) && (
                          <ArrowDown className="w-3.5 h-3.5 text-destructive shrink-0" aria-label="Score dropped" />
                        )}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
                {cohortAvgMonthlyScore && cohortAvgMonthlyScore.length === 12 && (
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      Cohort Avg
                    </TableCell>
                    {cohortAvgMonthlyScore.map((value, i) => (
                      <TableCell
                        key={i}
                        className="text-center text-sm font-semibold text-[hsl(var(--cohort-avg))]"
                      >
                        {value.toFixed(1)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
