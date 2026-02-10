import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { BarChart3, Info } from "lucide-react";
import type { MonthlyResult } from "@/types/company";
import { SHORT_MONTHS } from "@/lib/utils";

const COHORT_AVG_INFO =
  "Cohort Avg is the average organic visibility score across all companies in the same cohort. It uses organic score only (no boost or ads).";

interface SimulationChartProps {
  data: MonthlyResult[];
  cohortAvgMonthlyScore?: number[];
}

export function SimulationChart({ data, cohortAvgMonthlyScore }: SimulationChartProps) {
  const chartData = data.map((d, i) => ({
    name: SHORT_MONTHS[d.month - 1],
    month: d.month,
    organic: Number(d.organicScore.toFixed(1)),
    boost: Number(d.boostScore.toFixed(1)),
    ads: Number(d.adsScore.toFixed(1)),
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                }}
              />
              <Bar
                dataKey="organic"
                name="Organic"
                stackId="scores"
                fill="hsl(var(--chart-organic))"
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="boost"
                name="Boost"
                stackId="scores"
                fill="hsl(var(--chart-boost))"
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="ads"
                name="Ads"
                stackId="scores"
                fill="hsl(var(--chart-ads))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="hsl(var(--chart-total))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--chart-total))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
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
        {cohortAvgMonthlyScore && cohortAvgMonthlyScore.length === 12 && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full p-0.5 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="How Cohort Avg is computed"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Cohort Avg</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{COHORT_AVG_INFO}</p>
              </TooltipContent>
            </UITooltip>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
