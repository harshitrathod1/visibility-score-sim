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
import { BarChart3 } from "lucide-react";
import type { MonthlyResult } from "@/types/company";

interface SimulationChartProps {
  data: MonthlyResult[];
}

export function SimulationChart({ data }: SimulationChartProps) {
  const chartData = data.map((d) => ({
    name: `M${d.month}`,
    month: d.month,
    organic: Number(d.organicScore.toFixed(1)),
    boost: Number(d.boostScore.toFixed(1)),
    ads: Number(d.adsScore.toFixed(1)),
    total: Number(d.totalScore.toFixed(1)),
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
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
