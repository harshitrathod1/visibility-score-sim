Below is a **complete, implementation-ready PRD** for the Visibility Score Simulator prototype you’re building.

---

# Product Requirements Document (PRD)

**Product:** Visibility Score Simulator (Prototype)
**Owner:** —
**Audience:** Product, Sales, Engineering, Leadership
**Goal:** Provide an interactive UI to simulate and explain how **Organic, Boost, and Ads** contribute to a single **Visibility Score (0–100)** over 12 months for any company.

---

## 1. Problem Statement

Employers and internal teams need a clear, quantitative way to:

* Understand current visibility from **organic traffic**
* See the incremental impact of **boosting logic**
* See the impact of **ads**
* Compare **free tier (organic-only)** vs **paid tier (organic + boost + ads)**
* Explain everything using a **single normalized score (0–100)** and a visual chart

Currently, this logic exists only in formulas and spreadsheets. We need a **fast, interactive UI prototype** to simulate scenarios per company.

---

## 2. Objectives

* Allow selecting **any company** from a dataset
* Simulate **12 months** of visibility
* Show:

  * Organic score
  * Boost score
  * Ads score
  * Final total score
* Enforce:

  * Months **1–6: Organic only (free tier)**
  * Months **7–12: Organic + Boost + Ads (paid tier)**
* Make all key inputs **configurable per company**
* Visualize results using:

  * **Stacked bar chart** (Organic + Boost + Ads)
  * **Line chart** for Total Score
  * **Table** of monthly values

---

## 3. Success Criteria

* User can search and select any company
* User can tweak boost and ads parameters and instantly see impact
* Chart clearly shows:

  * Free vs paid phase
  * Contribution of each source
* All scores remain in **0–100**
* Reset restores **company defaults**
* Prototype can be built in any UI stack (web, no-code, internal tool)

---

## 4. Data Input

The system must accept **CSV/Excel** with columns:

* `companyId`
* `companyName`
* `monthly_impressions`
* `p90`
* `p99`
* `p100`

Usage:

* `monthly_impressions` → base organic impressions
* `p100` → used as **k** for organic & boost scoring

---

## 5. Company Selection UX

* Show **all companies** in a scrollable list/table
* Provide **search** by `companyId` or `companyName`
* User can:

  * Scroll and click, or
  * Search and select
* On selection:

  * Load company data
  * Initialize defaults (boost + ads tiers)
  * Run simulation and render chart + table

---

## 6. Bucketing & Defaults

### 6.1 Ads Capacity Buckets (kₐ)

Based on `p100`:

| Tier   | p100 Range      | kₐ (Ads Ceiling) |
| ------ | --------------- | ---------------- |
| Tier 1 | < 10,000        | 6,00,000 (6L)    |
| Tier 2 | 10,000 – 50,000 | 12,00,000 (12L)  |
| Tier 3 | > 50,000        | 20,00,000 (20L)  |

* On company select:

  * Assign default `k_a`
* UI allows:

  * Editing `k_a`
  * Reset restores default for that company

---

### 6.2 Boost Buckets (Based on Monthly Impressions)

Boost is defined as **incremental impressions over organic**.

Boost multiplier options:

| Monthly Impressions (iₒ) | Default Multiplier | Meaning     |
| ------------------------ | ------------------ | ----------- |
| < 10,000                 | 3.0×               | +200% boost |
| 10,000 – 50,000          | 2.0×               | +100% boost |
| > 50,000                 | 1.2×               | +20% boost  |

Interpretation:

* Boost impressions:
  [
  i_b = (boost_multiplier - 1) \times i_o
  ]

UI:

* Dropdown or slider: **1.2×, 2.0×, 3.0×, Custom**
* Reset restores company default

---

## 7. Ads Quantity Modeling

In addition to `k_a`, introduce:

* `total_ads_qty` per company:

  * Randomly assigned on company selection (within sensible bounds for tier)
  * Also **configurable in UI**
* Allocation:

  * Months 1–6: `i_a = 0`
  * Months 7–12: Split `total_ads_qty` **randomly across 6 months** such that:

    * (\sum_{m=7}^{12} i_a(m) = total_ads_qty)
    * Each month gets a random non-negative portion

Reset restores default/random `total_ads_qty`.

---

## 8. Organic Impression Simulation

To simulate real-world variance:

* Month 1:
  [
  i_o(1) = monthly_impressions \times random(0.8, 1.1)
  ]

* Month m = 2..12:
  [
  i_o(m) = i_o(m-1) \times random(0.8, 1.1)
  ]

Where:
[
random(0.8, 1.1) \approx RANDBETWEEN(80,110)/100
]

---

## 9. Timeline Rules

* **Months 1–6 (Free Tier):**

  * `i_b = 0`
  * `i_a = 0`
  * Only Organic contributes
* **Months 7–12 (Paid Tier):**

  * `i_b = (boost_multiplier - 1) * i_o`
  * `i_a` from ads allocation
  * Organic + Boost + Ads all contribute

---

## 10. Scoring Formulas

Let:

* ( k = p100 )
* ( k_a ) = ads ceiling
* ( i_o ) = organic impressions
* ( i_b ) = boost impressions
* ( i_a ) = ads impressions

### Organic:

[
S_{org} = 100 \cdot (1 - e^{-i_o / k})
]

### Boost:

[
S_{boost} =
\begin{cases}
0 & m \le 6 \
100 \cdot e^{-i_o / k} \cdot (1 - e^{-i_b / k}) & m \ge 7
\end{cases}
]

### Ads:

[
S_{ads_raw} =
\begin{cases}
0 & m \le 6 \
100 \cdot (1 - e^{-i_a / k_a}) & m \ge 7
\end{cases}
]

### Base:

[
S_{base} = S_{org} + S_{boost}
]

### Total (50–50 weighting):

[
S_{total} =
\begin{cases}
S_{org} & m \le 6 \
0.5 \cdot S_{base} + 0.5 \cdot S_{ads_raw} & m \ge 7
\end{cases}
]

All scores must be clamped to **[0, 100]** if needed.

---

## 11. Visualization Requirements

### Chart

* X-axis: Month 1 → 12
* Y-axis: Score 0 → 100
* **Stacked bars**:

  * Bottom: Organic (Blue)
  * Middle: Boost (Yellow)
  * Top: Ads (Green)
* **Line**:

  * Red line: Total Score

### Table (Below Chart)

Columns:

* Month
* Organic Score
* Boost Score
* Ads Score
* Total Score

---

## 12. UI Controls

Per selected company:

* Boost multiplier:

  * Dropdown/slider: 1.2×, 2.0×, 3.0×, Custom
* Ads:

  * `total_ads_qty` input
  * `k_a` input (default from tier)
* Buttons:

  * Apply / Recalculate
  * Reset to company defaults

---

## 13. Interaction Behavior

* On any input change:

  * Re-run simulation
  * Update chart + table
* On company change:

  * Load defaults
  * Re-run simulation
* On Reset:

  * Restore:

    * Default boost multiplier
    * Default `k_a`
    * Default `total_ads_qty`
  * Re-run simulation

---

## 14. Non-Functional Requirements

* Platform-agnostic (can be built in web, no-code, internal tools)
* Runs fully client-side for prototype
* Handles at least ~1,000 companies smoothly
* Deterministic option (optional) for random seed to reproduce scenarios

---

## 15. Out of Scope (For Prototype)

* Authentication / roles
* Saving scenarios
* Exporting reports
* Backend persistence
* Real ads delivery or real impression tracking

---

## 16. Key Value

* Makes **visibility economics explainable**
* Shows **free vs paid delta clearly**
* Helps Sales/Product **demo scenarios**
* Provides a **shared mental model** for Organic vs Boost vs Ads in one score

---

If you want, I can now convert this into:

* A **1-page executive PRD summary**, or
* A **JIRA/engineering task breakdown**, or
* A **wireframe-level UI spec**.