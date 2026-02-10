# Changes V2 - Cohort Metrics Prototype Plan

## 1) Goal

Add two real (non-dummy) cohort features to the Visibility Score Simulator:

1. Percentile rank of selected company within its cohort.
2. Cohort average score for selected company's cohort.

This plan is optimized for **fast prototype delivery** (not production hardening).

---

## 2) Locked Decisions

1. Cohort key: `cohort_id` from input file (fallback: `${iec_range}_${pi}` if missing).
2. Percentile metric: rank by **Month 12 Total Score**.
3. Average metric: **avg(totalScore of months 1..12)**.
4. Cohort graph line: show monthly cohort average (`M1..M12`) as comparison line.
5. Computation mode: frontend-only using **Web Worker** for 7k-10k rows.
6. Regeneration behavior:
   - Auto-regenerate on file upload.
   - Manual regenerate button after Simulation Control changes.
   - Do not auto-regenerate on each slider move.

---

## 3) Input Data Contract

Expected columns in uploaded CSV/XLSX:

- `pi`
- `piName`
- `iec_range`
- `cohort_id`
- `companyId`
- `avg_monthly_impressions`
- `p99`
- `p100`
- `total_companies_in_cohort`

Default base dataset file for prototype startup:

- `company_impressions_data_v2.csv` (repo root source file)
- served in app as `/company_impressions_data_v2.csv`

Mapping to simulator inputs:

- `avg_monthly_impressions` -> base organic impressions
- `p100` -> `k` (organic/boost curve parameter)
- `p100` bucket -> default `k_a` and default `totalAdsQty` choice set

Validation rules:

- Skip row if `companyId` missing.
- Skip row if `avg_monthly_impressions <= 0` or `p100 <= 0`.
- Keep counters for skipped rows and expose in UI warning text.

---

## 4) Output Benchmark Contract (`benchmarks_v2.json`)

Use one generated benchmark file in memory (and optionally write to `public/` for default snapshot).

```json
{
  "version": "v2",
  "generatedAt": "ISO_DATE",
  "configHash": "string",
  "summary": {
    "inputRows": 0,
    "validRows": 0,
    "skippedRows": 0,
    "cohortCount": 0
  },
  "companies": {
    "COMPANY_ID": {
      "cohortId": "iec_pi",
      "month12Score": 0,
      "avgScore1to12": 0,
      "percentileRankM12": 0
    }
  },
  "cohorts": {
    "COHORT_ID": {
      "cohortSize": 0,
      "expectedCohortSize": 0,
      "cohortAvgMonthlyScore": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "cohortAvgScore1to12": 0
    }
  }
}
```

Notes:

- `percentileRankM12` range: `0..100`.
- `cohortAvgMonthlyScore` length must always be `12`.

---

## 5) Computation Logic

### 5.1 Per-company simulation result

For each valid row:

1. Build simulation config (`boostMultiplier`, `totalAdsQty`, `adsCeiling`, `k`).
2. Run existing 12-month simulation.
3. Compute:
   - `month12Score = totalScore[12]`
   - `avgScore1to12 = mean(totalScore[1..12])`
   - `monthlySeries = totalScore[1..12]`

### 5.2 Cohort aggregates

Group by `cohort_id`.

For each cohort:

1. `cohortAvgMonthlyScore[m] = mean(monthlySeries[m] for all cohort companies)`
2. `cohortAvgScore1to12 = mean(avgScore1to12 for all cohort companies)`
3. Save `cohortSize` and `expectedCohortSize`.

### 5.3 Percentile rank (M12)

For each cohort:

1. Take all `month12Score` values and sort ascending.
2. For each company score `s`:
   - `percentileRankM12 = 100 * count(score <= s) / N`
3. Store percentile per company.

This is sufficient for prototype. Tie handling can be improved later if needed.

---

## 6) Randomization Policy for Prototype

Need stable numbers for cohort comparison. Use deterministic randomness during benchmark generation:

1. Add seeded RNG support to simulation utilities.
2. Seed should be deterministic from `companyId + configHash`.
3. Same input + same controls should produce same benchmark output.

This avoids percentile/average changing unexpectedly on refresh.

---

## 7) UI Changes

### 7.1 New metrics in dashboard

Show for selected company:

1. `Percentile Rank (M12)` (example: `82.4 percentile`).
2. `Company Avg Score (M1-M12)`.
3. `Cohort Avg Score (M1-M12)`.

### 7.2 Chart

In `Visibility Score Simulation` chart:

1. Keep existing bars + total line for selected company.
2. Add one more line: `Cohort Avg` using `cohortAvgMonthlyScore`.

### 7.3 Controls

Inside Simulation Controls:

1. Add button: `Regenerate Cohort Metrics`.
2. Show loading state while worker computes.
3. Show status text: `Cohort metrics reflect current controls` or `Outdated - regenerate`.

### 7.4 Upload behavior

On upload:

1. Parse rows.
2. Trigger benchmark generation in worker.
3. Enable cohort metrics only after generation completes.

---

## 8) Default No-Interaction Behavior

If the user does not upload a file or touch controls, cohort metrics must still be visible using pre-generated defaults.

1. Keep default source file as `company_impressions_data_v2.csv` (with cohort columns).
2. Make it available to frontend as `public/company_impressions_data_v2.csv`.
3. Generate `public/benchmarks_v2.json` before running app/deploy.
4. On app startup, load both files:
   - `company_impressions_data_v2.csv` for company list.
   - `benchmarks_v2.json` for cohort averages and percentiles.
5. If benchmark file is missing or invalid, show clear fallback message:
   - `Cohort benchmarks unavailable for default dataset`.
6. Uploaded file or control changes mark defaults as stale until regeneration.

Build/deploy requirement:

1. Add script `bench:generate` to create `public/benchmarks_v2.json`.
2. Run `bench:generate` in release flow before `build`.

---

## 9) Performance Plan (7k-10k rows)

1. Move all benchmark computation to Web Worker.
2. Send progress events every fixed batch (for UI progress indicator).
3. Keep main thread free for interactivity.
4. Recompute only on explicit button after control changes.

---

## 10) File-Level Implementation Plan

### A) Types and data models

- Update `src/types/company.ts`
  - Add input row type with cohort fields.
  - Add benchmark output types (`CompanyBenchmark`, `CohortBenchmark`, `BenchmarkFile`).

### B) Simulation deterministic support

- Update `src/lib/simulation.ts`
  - Add optional RNG function parameter (`rng?: () => number`).
  - Replace direct `Math.random()` usage with RNG wrapper.

### C) Benchmark generator logic

- Add `src/lib/benchmark.ts`
  - `generateBenchmarks(rows, config): BenchmarkFile`
  - Grouping, cohort averages, percentile computation.

### D) Worker

- Add `src/workers/benchmarkWorker.ts`
  - Accept rows + config.
  - Run generator.
  - Post progress + final benchmark payload.

### E) Page orchestration

- Update `src/pages/Index.tsx`
  - Parse new input columns.
  - Manage benchmark state (`loading`, `stale`, `error`, `data`).
  - Trigger worker on upload and on regenerate action.
  - Join selected company with benchmark metrics.

### F) UI components

- Update `src/components/ControlPanel.tsx`
  - Add `Regenerate Cohort Metrics` button + loading/disabled state.
- Update `src/components/SimulationChart.tsx`
  - Add optional `cohortAvgMonthlyScore` line.
- Update `src/components/ScoreCards.tsx` or add new `src/components/CohortMetricsCard.tsx`
  - Show percentile and average metrics.

### G) Default pre-generated snapshot

- Add `scripts/generate-benchmarks.ts` (Node script, required for default startup benchmarks)
  - Reads `company_impressions_data_v2.csv`.
  - Outputs `public/benchmarks_v2.json`.
- Add npm script:
  - `"bench:generate": "tsx scripts/generate-benchmarks.ts"`
- Update build flow:
  - ensure `bench:generate` runs before `build`.

---

## 11) Acceptance Criteria

1. Uploading a 7k-10k row file does not freeze UI.
2. For selected company, UI shows:
   - Percentile rank by Month 12.
   - Company avg score (M1-M12).
   - Cohort avg score (M1-M12).
3. Chart includes cohort average line (M1-M12).
4. Changing knobs marks benchmark as stale.
5. Clicking `Regenerate Cohort Metrics` refreshes cohort metrics.
6. No dummy values are shown when benchmark data is unavailable.
7. With no user interaction, default dataset loads with default benchmark snapshot and cohort metrics are visible.

---

## 12) Non-Goals (for this prototype)

1. No backend job queue/distributed compute.
2. No advanced statistical confidence intervals.
3. No strict tie-method standardization beyond `<=` percentile rule.
4. No production-grade caching/invalidation strategy.

---

## 13) Short Build Order (for coding agents)

1. Add types (`company + benchmark`).
2. Refactor simulation to accept seeded RNG.
3. Build `generateBenchmarks` util + tests for percentile and averages.
4. Add `bench:generate` script and produce `public/benchmarks_v2.json` for defaults.
5. Load default benchmark snapshot on app startup.
6. Add Web Worker integration in `Index`.
7. Add UI elements (chart line, cards, regenerate button).
8. Validate with sample 10k-row file.
