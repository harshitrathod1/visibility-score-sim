import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createSeededRng } from "@/lib/simulation";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Derives 12 monthly cohort avg values from the yearly cohort avg (current logic).
 * Each month gets a deterministic multiplier in [0.9, 1.1] for ±10% variation.
 */
export function getCohortAvgMonthlyWithVariation(
  cohortAvgScore1to12: number,
  cohortId: string
): number[] {
  const rng = createSeededRng(`cohort_avg_display_${cohortId}`);
  return Array.from({ length: 12 }, () => {
    const factor = 0.9 + 0.2 * rng();
    return Number((cohortAvgScore1to12 * factor).toFixed(1));
  });
}

export const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getLast12MonthLabels(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return `${SHORT_MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
  });
}
