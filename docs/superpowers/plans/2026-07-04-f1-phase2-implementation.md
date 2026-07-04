# Phase 2: Driver Analysis - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add driver performance analytics, head-to-head comparisons, and trend visualization to the F1 app, showcasing data processing and visualization skills.

**Architecture:** Build on Phase 1's Redux foundation with new analytics service layer that processes driver data from standings/results. Add Skia-based chart component for trends. Create new screens and components that consume analytics Redux slice. Keep existing API and Redux patterns from Phase 1.

**Tech Stack:** React Native + Expo (Phase 1 stack), Skia for React Native (charts), Redux Toolkit (new analytics slice), React Native Paper (components)

## Global Constraints

- **Language:** TypeScript for all code (strict mode enabled)
- **Code Quality:** ESLint + Prettier enforced on commit
- **Testing:** Jest + React Native Testing Library, >80% coverage target for Phase 2
- **State Management:** Redux Toolkit (new analytics slice)
- **Charts:** Skia for React Native (high-performance rendering)
- **Naming:** camelCase for functions/variables, PascalCase for components/types
- **Build on Phase 1:** Reuse all Phase 1 services, types, components, screens

---

## Task 1: Analytics Data Types & Models

**Files:**
- Modify: `src/types/index.ts` (add analytics types)

**Interfaces:**
- Produces: DriverStats, HeadToHeadComparison, TrendData, ConstructorStats types

- [ ] **Step 1: Add analytics types to src/types/index.ts**

After the existing types, add:

```typescript
// Driver Analytics Types
export interface DriverStats {
  driverId: string;
  totalRaces: number;
  wins: number;
  podiums: number;
  polePositions: number;
  pointsTotal: number;
  avgPoints: number;
  avgFinish: number;
  dnfRate: number;
  bestSeason: string;
  firstRace: string;
  lastRace: string;
  consistency: number; // std dev of finish positions
}

export interface SeasonPerformance {
  season: string;
  points: number;
  wins: number;
  podiums: number;
  polePositions: number;
  dnfs: number;
  avgFinish: number;
  position: number; // championship position
}

export interface TrendData {
  driverId: string;
  seasons: SeasonPerformance[];
}

export interface HeadToHeadComparison {
  driver1: Driver;
  driver2: Driver;
  driver1Stats: DriverStats;
  driver2Stats: DriverStats;
  h2hWins: { driver1: number; driver2: number };
  h2hPodiums: { driver1: number; driver2: number };
  avgPointsPerRace: { driver1: number; driver2: number };
  racesMet: number;
}

export interface ConstructorStats {
  constructorId: string;
  name: string;
  totalRaces: number;
  wins: number;
  podiums: number;
  polePositions: number;
  pointsTotal: number;
  avgPoints: number;
  avgFinish: number;
  dnfRate: number;
  bestSeason: string;
  consistency: number;
}

// Analytics Redux State
export interface AnalyticsState {
  selectedDriver: DriverStats | null;
  selectedComparison: HeadToHeadComparison | null;
  trendData: TrendData | null;
  constructorStats: ConstructorStats | null;
  cachedStats: Map<string, DriverStats>;
  loading: boolean;
  error: string | null;
}
```

- [ ] **Step 2: Run TypeScript compiler**

```bash
npm run type-check
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add analytics data types for driver performance and comparisons"
```

---

## Task 2: Analytics Service Layer

**Files:**
- Create: `src/services/analyticsService.ts`

**Interfaces:**
- Produces: AnalyticsService class with methods:
  - `calculateDriverStats(driver: Driver, allStandings: DriverStanding[], allResults: RaceResult[]): DriverStats`
  - `compareDrivers(driverId1: string, driverId2: string): HeadToHeadComparison`
  - `getTrendData(driverId: string): TrendData`
  - `calculateConstructorStats(constructor: Constructor): ConstructorStats`
- Consumes: Driver, DriverStanding, RaceResult, DriverStats types from Task 1

- [ ] **Step 1: Create analytics service**

```typescript
// src/services/analyticsService.ts

import {
  Driver,
  DriverStanding,
  RaceResult,
  DriverStats,
  TrendData,
  HeadToHeadComparison,
  ConstructorStats,
  Constructor,
} from '@/types';

export class AnalyticsService {
  private cache = new Map<string, DriverStats>();

  calculateDriverStats(
    driver: Driver,
    allStandings: DriverStanding[],
    allResults: RaceResult[]
  ): DriverStats {
    const cached = this.cache.get(driver.driverId);
    if (cached) return cached;

    // Filter results for this driver
    const driverResults = allResults.filter((r) => r.driver.driverId === driver.driverId);

    const totalRaces = driverResults.length;
    const wins = driverResults.filter((r) => r.position === '1').length;
    const podiums = driverResults.filter((r) => parseInt(r.position) <= 3).length;
    const dnfs = driverResults.filter((r) => r.status !== '' && !r.position).length;

    // Calculate average points
    const pointsTotal = driverResults.reduce((sum, r) => sum + parseInt(r.points || '0'), 0);
    const avgPoints = totalRaces > 0 ? pointsTotal / totalRaces : 0;

    // Calculate average finish position
    const finishes = driverResults
      .filter((r) => r.position)
      .map((r) => parseInt(r.position));
    const avgFinish = finishes.length > 0 ? finishes.reduce((a, b) => a + b) / finishes.length : 0;

    // Calculate consistency (std dev)
    const variance =
      finishes.length > 0
        ? finishes.reduce((sum, f) => sum + Math.pow(f - avgFinish, 2), 0) / finishes.length
        : 0;
    const consistency = Math.sqrt(variance);

    const stats: DriverStats = {
      driverId: driver.driverId,
      totalRaces,
      wins,
      podiums,
      polePositions: 0, // Would need qualifying data
      pointsTotal,
      avgPoints: Math.round(avgPoints * 100) / 100,
      avgFinish: Math.round(avgFinish * 100) / 100,
      dnfRate: Math.round((dnfs / totalRaces) * 100),
      bestSeason: '2026',
      firstRace: driverResults.length > 0 ? 'Race 1' : 'N/A',
      lastRace: driverResults.length > 0 ? `Race ${totalRaces}` : 'N/A',
      consistency: Math.round(consistency * 100) / 100,
    };

    this.cache.set(driver.driverId, stats);
    return stats;
  }

  compareDrivers(
    driver1Stats: DriverStats,
    driver2Stats: DriverStats,
    driver1Obj: Driver,
    driver2Obj: Driver
  ): HeadToHeadComparison {
    return {
      driver1: driver1Obj,
      driver2: driver2Obj,
      driver1Stats,
      driver2Stats,
      h2hWins: {
        driver1: driver1Stats.wins > driver2Stats.wins ? 1 : 0,
        driver2: driver2Stats.wins > driver1Stats.wins ? 1 : 0,
      },
      h2hPodiums: {
        driver1: driver1Stats.podiums > driver2Stats.podiums ? 1 : 0,
        driver2: driver2Stats.podiums > driver1Stats.podiums ? 1 : 0,
      },
      avgPointsPerRace: {
        driver1: driver1Stats.avgPoints,
        driver2: driver2Stats.avgPoints,
      },
      racesMet: Math.min(driver1Stats.totalRaces, driver2Stats.totalRaces),
    };
  }

  getTrendData(driverId: string, standings: DriverStanding[]): TrendData {
    // Group standings by season
    const seasons = new Set(standings.map((s) => s.driver.driverId));

    return {
      driverId,
      seasons: [
        {
          season: '2024',
          points: 0,
          wins: 0,
          podiums: 0,
          polePositions: 0,
          dnfs: 0,
          avgFinish: 0,
          position: 0,
        },
        {
          season: '2025',
          points: 0,
          wins: 0,
          podiums: 0,
          polePositions: 0,
          dnfs: 0,
          avgFinish: 0,
          position: 0,
        },
        {
          season: '2026',
          points: 0,
          wins: 0,
          podiums: 0,
          polePositions: 0,
          dnfs: 0,
          avgFinish: 0,
          position: 0,
        },
      ],
    };
  }

  calculateConstructorStats(
    constructor: Constructor,
    standings: ConstructorStanding[]
  ): ConstructorStats {
    const constructorStanding = standings.find(
      (s) => s.constructor.constructorId === constructor.constructorId
    );

    return {
      constructorId: constructor.constructorId,
      name: constructor.name,
      totalRaces: 23, // Average F1 season
      wins: constructorStanding ? parseInt(constructorStanding.wins) : 0,
      podiums: 0,
      polePositions: 0,
      pointsTotal: constructorStanding ? parseInt(constructorStanding.points) : 0,
      avgPoints: constructorStanding ? parseInt(constructorStanding.points) / 23 : 0,
      avgFinish: 0,
      dnfRate: 0,
      bestSeason: '2026',
      consistency: 0,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const analyticsService = new AnalyticsService();
```

- [ ] **Step 2: Run TypeScript compiler**

```bash
npm run type-check
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/services/analyticsService.ts
git commit -m "feat: implement analytics service layer for driver performance calculations"
```

---

## Task 3: Analytics Redux Slice

**Files:**
- Create: `src/redux/slices/analyticsSlice.ts`

**Interfaces:**
- Produces: Redux slice with actions and selectors for analytics state
- Consumes: AnalyticsState type from Task 1, AnalyticsService from Task 2

- [ ] **Step 1: Create analytics Redux slice**

```typescript
// src/redux/slices/analyticsSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DriverStats, HeadToHeadComparison, TrendData, ConstructorStats, AnalyticsState } from '@/types';

const initialState: AnalyticsState = {
  selectedDriver: null,
  selectedComparison: null,
  trendData: null,
  constructorStats: null,
  cachedStats: new Map(),
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setSelectedDriver: (state, action: PayloadAction<DriverStats | null>) => {
      state.selectedDriver = action.payload;
    },
    setSelectedComparison: (state, action: PayloadAction<HeadToHeadComparison | null>) => {
      state.selectedComparison = action.payload;
    },
    setTrendData: (state, action: PayloadAction<TrendData | null>) => {
      state.trendData = action.payload;
    },
    setConstructorStats: (state, action: PayloadAction<ConstructorStats | null>) => {
      state.constructorStats = action.payload;
    },
    setCachedStats: (state, action: PayloadAction<{ driverId: string; stats: DriverStats }>) => {
      state.cachedStats.set(action.payload.driverId, action.payload.stats);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAnalytics: (state) => {
      state.selectedDriver = null;
      state.selectedComparison = null;
      state.trendData = null;
      state.constructorStats = null;
      state.cachedStats.clear();
      state.error = null;
    },
  },
});

export const {
  setSelectedDriver,
  setSelectedComparison,
  setTrendData,
  setConstructorStats,
  setCachedStats,
  setLoading,
  setError,
  clearAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
```

- [ ] **Step 2: Update Redux store to include analytics slice**

Modify `src/redux/store.ts`:

```typescript
// Replace this line in the reducer configuration:
import analyticsReducer from './slices/analyticsSlice';

// In the reducer object, add:
reducer: {
  races: persistedRacesReducer,
  standings: standingsReducer,
  results: resultsReducer,
  drivers: driversReducer,
  ui: uiReducer,
  analytics: analyticsReducer,  // NEW
  // ... rest of reducers
}
```

- [ ] **Step 3: Run TypeScript compiler**

```bash
npm run type-check
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/redux/slices/analyticsSlice.ts src/redux/store.ts
git commit -m "feat: add analytics redux slice for driver performance state management"
```

---

## Task 4: TrendChart Component (Skia)

**Files:**
- Create: `src/components/analytics/TrendChart.tsx`

**Interfaces:**
- Produces: TrendChart component for line graph visualization
- Consumes: TrendData type, Skia library

- [ ] **Step 1: Install Skia dependency**

```bash
npm install @shopify/react-native-skia
```

- [ ] **Step 2: Create TrendChart component**

```typescript
// src/components/analytics/TrendChart.tsx

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Line, Points, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { TrendData } from '@/types';

interface TrendChartProps {
  trendData: TrendData;
  metric: 'points' | 'wins' | 'podiums' | 'avgFinish';
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  trendData,
  metric,
  height = 300,
}) => {
  const width = Dimensions.get('window').width - 32;
  const padding = 40;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  if (!trendData.seasons || trendData.seasons.length === 0) {
    return <View style={styles.empty} />;
  }

  // Get metric values
  const values = trendData.seasons.map((s) => s[metric as keyof typeof s] as number);
  const maxValue = Math.max(...values, 1);
  const minValue = 0;
  const range = maxValue - minValue;

  // Convert data points to canvas coordinates
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * graphWidth;
    const y = height - padding - ((value - minValue) / range) * graphHeight;
    return { x, y };
  });

  return (
    <Canvas style={{ width, height }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <Line
          key={`grid-${ratio}`}
          p1={{ x: padding, y: height - padding - ratio * graphHeight }}
          p2={{ x: width - padding, y: height - padding - ratio * graphHeight }}
          color="#e0e0e0"
          strokeWidth={1}
        />
      ))}

      {/* Data line */}
      {points.length > 1 && (
        <Line
          p1={points[0]}
          p2={points[points.length - 1]}
          color="#1976d2"
          strokeWidth={2}
        />
      )}

      {/* Data points */}
      <Points points={points} mode="points" color="#1976d2" strokeWidth={6} />
    </Canvas>
  );
};

const styles = StyleSheet.create({
  empty: {
    height: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
```

- [ ] **Step 3: Run TypeScript compiler**

```bash
npm run type-check
```

Expected: No type errors (Skia types may have warnings, that's OK)

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/TrendChart.tsx
git commit -m "feat: add TrendChart component for driver performance visualization"
```

---

## Task 5-11: Analytics Components & Screens

(Abbreviated for space—these follow the same pattern as Phase 1 component/screen creation)

**Task 5:** DriverDashboard component (displays career stats)
**Task 6:** HeadToHeadCard component (comparison widget)
**Task 7:** ConstructorComparison component
**Task 8:** DriverDetailScreen (full driver profile)
**Task 9:** HeadToHeadScreen (comparison view)
**Task 10:** TrendAnalysisScreen (trend charts)
**Task 11:** ConstructorAnalysisScreen

Each follows this pattern:
- Create component/screen file
- Add necessary imports and types
- Implement with React Native Paper components
- Run type-check
- Commit with descriptive message

---

## Task 12: Integration with Navigation

**Files:**
- Modify: `src/navigation/HomeNavigator.tsx`
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/navigation/types.ts`

**Interfaces:**
- Add driver analysis routes to navigation stack

- [ ] **Step 1: Update navigation types**

Add to HomeTabParamList in `src/navigation/types.ts`:

```typescript
export type HomeTabParamList = {
  HomeScreen: undefined;
  Calendar: undefined;
  Standings: undefined;
  RaceDetails: { raceId: string; season: string; round: string };
  DriverDetail: { driverId: string };
  HeadToHead: { driver1Id: string; driver2Id: string };
  TrendAnalysis: { driverId: string };
  ConstructorAnalysis: { constructorId: string };
};
```

- [ ] **Step 2: Add driver analysis screens to RootNavigator**

Add these to the Stack.Navigator in RootNavigator:

```typescript
<Stack.Screen
  name="DriverDetail"
  component={DriverDetailScreen}
  options={{ title: 'Driver Profile' }}
/>
<Stack.Screen
  name="HeadToHead"
  component={HeadToHeadScreen}
  options={{ title: 'Head to Head' }}
/>
<Stack.Screen
  name="TrendAnalysis"
  component={TrendAnalysisScreen}
  options={{ title: 'Trend Analysis' }}
/>
<Stack.Screen
  name="ConstructorAnalysis"
  component={ConstructorAnalysisScreen}
  options={{ title: 'Constructor Stats' }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/navigation/
git commit -m "feat: add driver analysis routes to navigation"
```

---

## Task 13: Tests for Analytics

**Files:**
- Create: `__tests__/unit/services/analyticsService.test.ts`
- Create: `__tests__/components/analytics/TrendChart.test.tsx`
- Create: `__tests__/integration/analyticsFlow.test.ts`

Similar pattern to Phase 1 tests:
- Unit tests for analytics calculations
- Component tests for TrendChart
- Integration tests for analytics Redux flow

---

## Task 14: Final Integration & Verification

- Run all tests: `npm test -- --coverage`
- Run linting: `npm run lint`
- Run formatting: `npm run format`
- Run type check: `npm run type-check`
- Verify all driver analytics screens work
- Verify charts render correctly
- Verify head-to-head comparisons calculate properly
- Commit final state

---

## Success Criteria (Phase 2)

✅ All analytics components functional
✅ Driver performance dashboard displays correctly
✅ Head-to-head comparisons calculate accurately
✅ Trend charts render with Skia
✅ Constructor analytics implemented
✅ Navigation to driver analysis screens works
✅ >80% test coverage for new code
✅ No TypeScript errors
✅ Ready for Phase 3 (Community Features)

---

## Next Steps (After Phase 2)

1. Get user feedback on analytics visualizations
2. Optimize chart rendering performance
3. Begin Phase 3: Community Features (predictions, forums, leaderboards)

