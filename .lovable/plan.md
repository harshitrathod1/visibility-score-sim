

# Implementation Plan

## Change 1: Routing — v1 at `/`, v2 at `/v2`

### `src/App.tsx`
- Keep `/` → `Index` (current v1 dashboard, unchanged)
- Add `/v2` → new `IndexV2` page

### New Files
1. **`src/pages/IndexV2.tsx`** — Copy of `Index.tsx` with these removals/swaps:
   - Remove `MonthlyAveragesCard` (shows Organic/Boost/Ads breakdown)
   - Replace `SimulationChart` with `SimulationChartV2` (total score only)
   - Replace `TrendTable` with `TrendTableV2` (total score row only)
   - Keep ScoreCards, CohortMetricsCard, AdvancedSettings as-is
   - Remove company count from header

2. **`src/components/SimulationChartV2.tsx`** — Simplified chart:
   - Remove the 3 stacked `<Bar>` components (organic, boost, ads)
   - Show only a single `<Bar>` for `total` score
   - Keep the `<Line>` for cohort avg (dashed)
   - Remove Organic/Boost/Ads from legend
   - Use dynamic month labels

3. **`src/components/TrendTableV2.tsx`** — Simplified table:
   - Show only one row: **Total Score** per month
   - Remove Organic, Boosted, Ads rows
   - Use dynamic month labels

## Change 2: Period Labels on Cohort Metric Tiles

### `src/components/CohortMetricsCard.tsx`
- Under the Company Avg Score value (`companyAvgScore1to12.toFixed(1)`), add:
  ```
  <p className="text-xs text-muted-foreground mt-1">Avg across Months 1–12</p>
  ```
- Under the Cohort Avg Score value, add the same subtitle.

## Change 3: Dynamic X-Axis Month Labels

### `src/lib/utils.ts`
- Add helper function:
  ```typescript
  export function getLast12MonthLabels(): string[] {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return `${SHORT_MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
    });
  }
  ```
- Update `SimulationChart.tsx` to use `getLast12MonthLabels()` instead of `SHORT_MONTHS`
- New v2 chart and table components will also use this helper
- Update `TrendTable.tsx` to use dynamic labels

## Change 4: Remove Company Count from Header

### `src/pages/Index.tsx`
- Remove the block showing `{displayCompanies.length} companies` with the TrendingUp icon from the header

### `src/pages/IndexV2.tsx`
- Will not include it either

## Summary of All File Changes

| File | Action |
|------|--------|
| `src/App.tsx` | Add `/v2` route |
| `src/pages/IndexV2.tsx` | Create — simplified v2 page |
| `src/components/SimulationChartV2.tsx` | Create — total-only chart |
| `src/components/TrendTableV2.tsx` | Create — total-only table |
| `src/components/CohortMetricsCard.tsx` | Add period subtitles |
| `src/lib/utils.ts` | Add `getLast12MonthLabels()` |
| `src/pages/Index.tsx` | Remove company count, use dynamic months |
| `src/components/SimulationChart.tsx` | Use dynamic month labels |
| `src/components/TrendTable.tsx` | Use dynamic month labels |

