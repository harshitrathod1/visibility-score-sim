import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart3, Info } from "lucide-react";
import type { MonthlyResult } from "@/types/company";
import { getLast12MonthLabels } from "@/lib/utils";

const COHORT_AVG_INFO =
  "The average organic visibility score of your cohort for each month (no boost or ads).";

interface SimulationChartV2Props {
  data: MonthlyResult[];
  cohortAvgMonthlyScore?: number[];
}

export function SimulationChartV2({ data, cohortAvgMonthlyScore }: SimulationChartV2Props) {
  const monthLabels = getLast12MonthLabels();
  const chartData = data.map((d, i) => ({
    name: monthLabels[i],
    month: d.month,
    total: Number(d.totalScore.toFixed(1)),
    cohortAvg:
      cohortAvgMonthlyScore && cohortAvgMonthlyScore[i] != null
        ? Number(cohortAvgMonthlyScore[i].toFixed(1))
        : undefined,
  }));

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Visibility Score Simulation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={{ className: "stroke-border" }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={{ className: "stroke-border" }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                content={({ payload }) => (
                  <ul className="flex flex-wrap items-center justify-center gap-4 pt-2">
                    {payload?.map((entry) => (
                      <li
                        key={entry.value}
                        className="flex items-center gap-1.5"
                        style={{ color: entry.color }}
                      >
                        <span
                          className="inline-block w-4 h-0.5 rounded shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.value}</span>
                        {entry.value === "Cohort Avg" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                aria-label="How cohort avg is calculated"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[280px]">
                              {COHORT_AVG_INFO}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              />
              <Bar
                dataKey="total"
                name="Total Score"
                fill="hsl(var(--chart-total))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              {cohortAvgMonthlyScore && cohortAvgMonthlyScore.length === 12 && (
                <Line
                  type="monotone"
                  dataKey="cohortAvg"
                  name="Cohort Avg"
                  stroke="hsl(var(--chart-cohort))"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: "hsl(var(--chart-cohort))", strokeWidth: 0, r: 3 }}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
