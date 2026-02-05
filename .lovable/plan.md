
# UI Redesign: Consumer-Facing Dashboard with Advanced Settings

## Overview
Transform the current technical interface into a clean, consumer-friendly dashboard while preserving access to advanced simulation controls via a collapsible "Advanced Settings" panel.

## Architecture Approach

```text
+--------------------------------------------------+
|  Header                                          |
+--------------------------------------------------+
|  Company List  |  Consumer Dashboard             |
|  (Sidebar)     |  +---------------------------+  |
|                |  | Score Cards (Before/After)|  |
|                |  +---------------------------+  |
|                |  | Monthly Avg Cards         |  |
|                |  | (Organic/Boost/Ads)       |  |
|                |  +---------------------------+  |
|                |  | Chart (unchanged)         |  |
|                |  +---------------------------+  |
|                |  | 12-Month Trend Table      |  |
|                |  +---------------------------+  |
|                |  | [Advanced Settings] (col) |  |
|                |  +---------------------------+  |
+--------------------------------------------------+
```

## New Components

### 1. ScoreCards Component
A new component displaying two side-by-side cards:
- **Avg Visibility Before** - Average total score for months 1-6 (Free tier)
- **Avg Visibility After** - Average total score for months 7-12 (Subscription)
- Shows an upward arrow indicator if "After" is higher than "Before"

### 2. MonthlyAveragesCard Component
Displays three metric cards in a row:
- **Organic** - Average organic impressions during subscription (months 7-12)
- **Boosted** - Average boost impressions during subscription
- **Ads** - Average ads impressions during subscription
- Each card has an icon and colored left border matching the chart colors

### 3. TrendTable Component (Simplified)
A streamlined table replacing the detailed SimulationTable:
- Horizontal layout showing all 12 months as columns
- Rows: Organic, Boosted, Ads, Total
- Clean styling matching the reference image
- Values formatted in K/M notation for readability

### 4. AdvancedSettings Component
Wraps the existing ControlPanel in a collapsible section:
- Uses Collapsible component from Radix
- Shows "Advanced Settings" header with expand/collapse chevron
- Contains all the existing controls (Boost Multiplier, Ads Qty, k_a, etc.)
- Defaults to collapsed state

## File Changes

### New Files to Create:
1. `src/components/ScoreCards.tsx` - Before/After visibility comparison cards
2. `src/components/MonthlyAveragesCard.tsx` - Organic/Boost/Ads summary cards
3. `src/components/TrendTable.tsx` - Simplified 12-month horizontal trend table
4. `src/components/AdvancedSettings.tsx` - Collapsible wrapper for ControlPanel

### Files to Modify:
1. `src/pages/Index.tsx` - Restructure layout to use new consumer-facing components
2. `src/types/company.ts` - Add helper type for computed averages

## Detailed Implementation

### ScoreCards Component
```text
Props:
- monthlyResults: MonthlyResult[]

Computed Values:
- avgBefore = average of totalScore for months 1-6
- avgAfter = average of totalScore for months 7-12
- improvement = avgAfter - avgBefore

UI Layout:
+------------------------+  +------------------------+
| Avg Visibility Before  |  | Avg Visibility After   |
| Score                  |  | Score                  |
| 650                    |  | 820 (arrow icon)       |
+------------------------+  +------------------------+
```

### MonthlyAveragesCard Component
```text
Props:
- monthlyResults: MonthlyResult[]

Computed Values:
- avgOrganic = average of organicImpressions for months 7-12
- avgBoosted = average of boostImpressions for months 7-12  
- avgAds = average of adsImpressions for months 7-12

UI Layout:
+------------------+  +------------------+  +------------------+
| Icon | Organic   |  | Icon | Boosted  |  | Icon | Ads       |
|      | 15,000    |  |      | 5,000    |  |      | 8,000     |
+------------------+  +------------------+  +------------------+
(Blue border)         (Yellow border)       (Green border)
```

### TrendTable Component
```text
Props:
- monthlyResults: MonthlyResult[]

UI Layout (horizontal scrollable):
+----------+--------+--------+---+----------+
|          | Month1 | Month2 |...| Month12  |
+----------+--------+--------+---+----------+
| Organic  | 15,000 | 15,000 |...| 15,000   |
| Boosted  | 0      | 0      |...| 5,000    |
| Ads      | 0      | 0      |...| 8,000    |
| Total    | 15,000 | 15,000 |...| 28,000   |
+----------+--------+--------+---+----------+
```

### AdvancedSettings Component
```text
Props:
- config: SimulationConfig
- onConfigChange: (config) => void
- onReset: () => void
- onRecalculate: () => void

UI:
[Collapsible Header: "Advanced Settings" + ChevronDown icon]
|
+-- [Collapsed by default]
    |
    +-- ControlPanel (existing component)
```

### Updated Index.tsx Layout
```text
When company is selected:
1. Company info header (keep existing)
2. ScoreCards (new)
3. MonthlyAveragesCard (new)
4. SimulationChart (unchanged - same component)
5. TrendTable (new - replaces SimulationTable)
6. AdvancedSettings (new - wraps ControlPanel)
```

## Technical Details

### Styling Approach
- Use existing Tailwind classes and shadcn/ui components
- Match card styling with rounded corners, subtle shadows
- Use CSS variables for chart colors (--chart-organic, --chart-boost, --chart-ads)
- Maintain responsive design with mobile-friendly stacking

### State Management
- No new state required
- Consume existing `result.monthlyResults` and compute averages inline
- Advanced settings state (open/closed) managed locally in AdvancedSettings component

### Preserved Functionality
- SimulationChart remains completely unchanged
- All simulation logic in `src/lib/simulation.ts` untouched
- All config controls continue to work through AdvancedSettings
- Reset functionality preserved
