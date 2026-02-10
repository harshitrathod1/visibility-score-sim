import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, Info } from "lucide-react";

function getPercentileDisplay(rank: number): string {
  if (rank >= 99) return "Top 1%";
  if (rank >= 95) return "Top 5%";
  if (rank >= 90) return "Top 10%";
  if (rank >= 75) return "Top 25%";
  if (rank < 1) return "Bottom 1%";
  if (rank < 5) return "Bottom 5%";
  if (rank < 10) return "Bottom 10%";
  if (rank < 25) return "Bottom 25%";
  return "Average";
}

const COHORT_SECTION_TOOLTIP =
  "A cohort is the group of companies that share the same cohort_id (from your data file, or derived from iec_range and pi when missing). We run the same simulation for every company, then group results by cohort_id to compute averages and percentile rank (by Month 12 score within each cohort).";

const PERCENTILE_TOOLTIP =
  "Your position within similar companies. Based on your Latest visibility score, this shows how you rank among companies in the same cohort. Top 10% means you performed better than 90% of peers.";

const COMPANY_AVG_TOOLTIP =
  "Your average visibility over the year. Calculated as the mean of your monthly visibility scores from January to December.";

const COHORT_AVG_TOOLTIP =
  "Typical performance of your cohort. This is the average yearly organic visibility score across all companies in your cohort, used as a benchmark.";

interface CohortMetricsCardProps {
  percentileRankM12: number | undefined;
  companyAvgScore1to12: number | undefined;
  cohortAvgScore1to12: number | undefined;
  benchmarkUnavailable?: boolean;
}

export function CohortMetricsCard({
  percentileRankM12,
  companyAvgScore1to12,
  cohortAvgScore1to12,
  benchmarkUnavailable,
}: CohortMetricsCardProps) {
  if (benchmarkUnavailable) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          Cohort metrics
        </h3>
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Cohort benchmarks unavailable for this dataset.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAny =
    percentileRankM12 != null ||
    companyAvgScore1to12 != null ||
    cohortAvgScore1to12 != null;
  if (!hasAny) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          Cohort metrics
        </h3>
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              No cohort data for this company. Upload a file with cohort_id or regenerate cohort metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Users className="w-4 h-4" />
        Cohort metrics
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="How cohort is computed"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{COHORT_SECTION_TOOLTIP}</p>
          </TooltipContent>
        </Tooltip>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {percentileRankM12 != null && (
          <Card className="bg-card border-border border-l-4 border-l-[hsl(var(--cohort-percentile))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm text-muted-foreground">Percentile Rank</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="What this metric means"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{PERCENTILE_TOOLTIP}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {getPercentileDisplay(percentileRankM12)}
              </p>
            </CardContent>
          </Card>
        )}
        {companyAvgScore1to12 != null && (
          <Card className="bg-card border-border border-l-4 border-l-[hsl(var(--cohort-company))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm text-muted-foreground">Company Avg Score</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="What this metric means"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{COMPANY_AVG_TOOLTIP}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {companyAvgScore1to12.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        )}
        {cohortAvgScore1to12 != null && (
          <Card className="bg-card border-border border-l-4 border-l-[hsl(var(--cohort-avg))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm text-muted-foreground">Cohort Avg Score</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="What this metric means"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{COHORT_AVG_TOOLTIP}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {cohortAvgScore1to12.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
