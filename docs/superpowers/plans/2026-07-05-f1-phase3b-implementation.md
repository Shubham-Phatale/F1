# Phase 3B: Predictions + Leaderboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signed-in users predict each race's podium before lock, their predictions auto-score against real jolpica results on app open, and season + per-race leaderboards rank users — all on the free Firebase tier with client-side scoring.

**Architecture:** A pure scoring function + a `predictionService` (Firestore CRUD, owner-only, scores the user's own pending predictions using `ergastService.getRaceResults`). Redux slices hold predictions + leaderboard state. New Predict tab + MakePrediction + Leaderboard screens reuse the dark design system. Firestore security rules are documented in `firestore.rules` (applied by the user in the console).

**Tech Stack:** Expo SDK 54, Firebase JS SDK (Firestore), Redux Toolkit, React Navigation, existing `@/theme` + `@/components/ui`, jest-expo.

## Global Constraints

- **Language:** TypeScript strict; `npm run type-check` passes after every task
- **Tests:** jest-expo; full suite green after every task (127 baseline; new tests add to it)
- **Scoring:** exact +5, podium-wrong-spot +2, not-on-podium 0, perfect-podium +3 bonus; max 18; near-miss (right 3, two swapped) = 9
- **Deadline:** prediction locks at race start (`date` + `time` UTC; if `time` missing, lock = start of that day UTC)
- **Scoring trigger:** client scores ONLY its own predictions; each user writes only their own `predictions/*` + `leaderboard/{uid}` docs
- **Firestore state serializable:** store ISO strings, plain objects (no Timestamps) in Redux
- **Reuse:** `ergastService.getRaceResults(season, round)` for the actual podium; `db` from `@/config/firebase`; auth from `state.auth`
- **Design:** dark theme via `@/components/ui` + `@/theme`; new stack screens use the custom `BackButton` (no app bar)
- **Bundle:** `npx expo export --platform android` after the screens/navigation task; delete `dist/` after
- **Naming:** camelCase functions/vars, PascalCase components/types
- **Commits:** plain conventional; NO Co-Authored-By / Claude / AI mention

---

## Task 1: Types + pure scoring function

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/utils/scoring.ts`
- Create: `__tests__/unit/utils/scoring.test.ts`

**Interfaces:**
- Produces:
  - Types: `Prediction`, `LeaderboardEntry`, `PodiumScore`
  - `scorePrediction(predicted: [string, string, string], actual: [string, string, string]): PodiumScore`

- [ ] **Step 1: Add types to `src/types/index.ts`** (append after existing types)

```typescript
// Phase 3B — Predictions & Leaderboard
export interface Prediction {
  uid: string;
  season: string;
  round: string;
  raceId: string;
  p1: string;
  p2: string;
  p3: string;
  displayName: string;
  createdAt: string;
  status: 'pending' | 'scored';
  pointsEarned: number | null;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  seasonPoints: number;
  racesPlayed: number;
  updatedAt: string;
}

export interface PodiumScore {
  perSlot: [number, number, number];
  bonus: number;
  total: number;
}
```

- [ ] **Step 2: Write the failing test**

```typescript
// __tests__/unit/utils/scoring.test.ts
import { scorePrediction } from '@/utils/scoring';

describe('scorePrediction', () => {
  const actual: [string, string, string] = ['ver', 'lec', 'ham'];

  test('perfect podium = 18 (5+5+5 + 3 bonus)', () => {
    const s = scorePrediction(['ver', 'lec', 'ham'], actual);
    expect(s.perSlot).toEqual([5, 5, 5]);
    expect(s.bonus).toBe(3);
    expect(s.total).toBe(18);
  });

  test('near-miss (right 3, P2/P3 swapped) = 9', () => {
    const s = scorePrediction(['ver', 'ham', 'lec'], actual);
    // ver exact +5, ham on podium wrong spot +2, lec on podium wrong spot +2, no bonus
    expect(s.total).toBe(9);
    expect(s.bonus).toBe(0);
  });

  test('one exact, two off-podium = 5', () => {
    const s = scorePrediction(['ver', 'nor', 'pia'], actual);
    expect(s.perSlot).toEqual([5, 0, 0]);
    expect(s.total).toBe(5);
  });

  test('all wrong = 0', () => {
    const s = scorePrediction(['nor', 'pia', 'alo'], actual);
    expect(s.total).toBe(0);
  });

  test('right driver wrong spot only = 2', () => {
    // predict lec at P1; lec is actually P2 -> on podium, wrong spot
    const s = scorePrediction(['lec', 'nor', 'pia'], actual);
    expect(s.perSlot).toEqual([2, 0, 0]);
    expect(s.total).toBe(2);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- __tests__/unit/utils/scoring.test.ts --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 4: Implement `src/utils/scoring.ts`**

```typescript
import { PodiumScore } from '@/types';

const EXACT = 5;
const WRONG_SPOT = 2;
const PERFECT_BONUS = 3;

/**
 * Score a podium prediction against the actual podium.
 * predicted/actual are [P1, P2, P3] driverIds.
 * +5 exact position, +2 on podium wrong spot, +3 bonus if all three exact.
 */
export function scorePrediction(
  predicted: [string, string, string],
  actual: [string, string, string]
): PodiumScore {
  const perSlot = predicted.map((driver, i) => {
    if (!driver) return 0;
    if (driver === actual[i]) return EXACT;
    if (actual.includes(driver)) return WRONG_SPOT;
    return 0;
  }) as [number, number, number];

  const allExact = perSlot.every((p) => p === EXACT);
  const bonus = allExact ? PERFECT_BONUS : 0;
  const total = perSlot[0] + perSlot[1] + perSlot[2] + bonus;

  return { perSlot, bonus, total };
}
```

- [ ] **Step 5: Run test + type-check**

Run: `npm test -- __tests__/unit/utils/scoring.test.ts --watchAll=false` → PASS
Run: `npm run type-check` → clean

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/utils/scoring.ts __tests__/unit/utils/scoring.test.ts
git commit -m "feat: add prediction types and podium scoring function"
```

---

## Task 2: Deadline + validation helpers

**Files:**
- Create: `src/utils/predictionRules.ts`
- Create: `__tests__/unit/utils/predictionRules.test.ts`

**Interfaces:**
- Produces:
  - `getRaceLockTime(date: string, time?: string): number` — epoch ms of the lock (race start; if no time, start of that UTC day)
  - `isPredictionOpen(date: string, time: string | undefined, now: number): boolean`
  - `validatePodium(p1: string, p2: string, p3: string): { valid: boolean; error?: string }` — all present + distinct

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/unit/utils/predictionRules.test.ts
import { getRaceLockTime, isPredictionOpen, validatePodium } from '@/utils/predictionRules';

describe('predictionRules', () => {
  test('lock time uses date + time (UTC)', () => {
    const t = getRaceLockTime('2024-03-02', '15:00:00Z');
    expect(t).toBe(Date.parse('2024-03-02T15:00:00Z'));
  });

  test('lock time without time = start of that UTC day', () => {
    const t = getRaceLockTime('2024-03-02', undefined);
    expect(t).toBe(Date.parse('2024-03-02T00:00:00Z'));
  });

  test('open before lock, closed at/after lock', () => {
    const date = '2024-03-02';
    const time = '15:00:00Z';
    const lock = Date.parse('2024-03-02T15:00:00Z');
    expect(isPredictionOpen(date, time, lock - 1000)).toBe(true);
    expect(isPredictionOpen(date, time, lock)).toBe(false);
    expect(isPredictionOpen(date, time, lock + 1000)).toBe(false);
  });

  test('validatePodium requires 3 distinct non-empty drivers', () => {
    expect(validatePodium('ver', 'lec', 'ham').valid).toBe(true);
    expect(validatePodium('ver', 'ver', 'ham').valid).toBe(false);
    expect(validatePodium('ver', '', 'ham').valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/unit/utils/predictionRules.test.ts --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/utils/predictionRules.ts`**

```typescript
export function getRaceLockTime(date: string, time?: string): number {
  if (time) {
    // Ergast time is like "15:00:00Z"
    return Date.parse(`${date}T${time}`);
  }
  return Date.parse(`${date}T00:00:00Z`);
}

export function isPredictionOpen(date: string, time: string | undefined, now: number): boolean {
  return now < getRaceLockTime(date, time);
}

export function validatePodium(
  p1: string,
  p2: string,
  p3: string
): { valid: boolean; error?: string } {
  if (!p1 || !p2 || !p3) {
    return { valid: false, error: 'Pick a driver for all three positions.' };
  }
  if (p1 === p2 || p1 === p3 || p2 === p3) {
    return { valid: false, error: 'Each position must be a different driver.' };
  }
  return { valid: true };
}
```

- [ ] **Step 4: Run test + type-check**

Run: `npm test -- __tests__/unit/utils/predictionRules.test.ts --watchAll=false` → PASS
Run: `npm run type-check` → clean

- [ ] **Step 5: Commit**

```bash
git add src/utils/predictionRules.ts __tests__/unit/utils/predictionRules.test.ts
git commit -m "feat: add prediction deadline and validation helpers"
```

---

## Task 3: predictionService — Firestore CRUD + scoring orchestration

**Files:**
- Create: `src/services/predictionService.ts`
- Create: `__tests__/unit/services/predictionService.test.ts`

**Interfaces:**
- Consumes: `db` from `@/config/firebase`; `ergastService` from `@/services/ergastAPI`; `scorePrediction` (Task 1); `Prediction`, `LeaderboardEntry` (Task 1)
- Produces `predictionService` singleton with:
  - `savePrediction(input: { uid: string; displayName: string; season: string; round: string; raceId: string; p1: string; p2: string; p3: string }): Promise<void>` — upserts `predictions/{uid}_{season}_{round}` with `status:'pending', pointsEarned:null, createdAt`
  - `getUserPrediction(uid: string, season: string, round: string): Promise<Prediction | null>`
  - `getUserPredictions(uid: string, season: string): Promise<Prediction[]>` — all of a user's predictions this season
  - `scoreUserPendingPredictions(uid: string, season: string): Promise<void>` — for each pending prediction whose race has a podium result, compute points, write `{status:'scored', pointsEarned}`, then upsert `leaderboard/{uid}`
  - `getSeasonLeaderboard(): Promise<LeaderboardEntry[]>` — `leaderboard` ordered by seasonPoints desc
  - `getRaceLeaderboard(season: string, round: string): Promise<Prediction[]>` — scored predictions for that round ordered by pointsEarned desc

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/unit/services/predictionService.test.ts
jest.mock('@/config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db, _col, id) => ({ id })),
  collection: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
}));
jest.mock('@/services/ergastAPI', () => ({
  ergastService: { getRaceResults: jest.fn() },
}));

import { setDoc, getDoc, getDocs } from 'firebase/firestore';
import { ergastService } from '@/services/ergastAPI';
import { predictionService } from '@/services/predictionService';

describe('predictionService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('savePrediction upserts a pending prediction with the deterministic id', async () => {
    await predictionService.savePrediction({
      uid: 'u1', displayName: 'Ann', season: '2024', round: '1', raceId: '2024-1',
      p1: 'ver', p2: 'lec', p3: 'ham',
    });
    expect(setDoc).toHaveBeenCalled();
    const [ref, data] = (setDoc as jest.Mock).mock.calls[0];
    expect(ref.id).toBe('u1_2024_1');
    expect(data).toMatchObject({ status: 'pending', pointsEarned: null, p1: 'ver' });
  });

  test('scoreUserPendingPredictions scores a finished race and updates leaderboard', async () => {
    // one pending prediction
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ data: () => ({
        uid: 'u1', displayName: 'Ann', season: '2024', round: '1', raceId: '2024-1',
        p1: 'ver', p2: 'lec', p3: 'ham', status: 'pending', pointsEarned: null, createdAt: 'x',
      }) }],
    });
    // actual podium from jolpica
    (ergastService.getRaceResults as jest.Mock).mockResolvedValue([
      { position: '1', driver: { driverId: 'ver' } },
      { position: '2', driver: { driverId: 'lec' } },
      { position: '3', driver: { driverId: 'ham' } },
    ]);
    // for the leaderboard recompute, return the now-scored prediction
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ data: () => ({ status: 'scored', pointsEarned: 18 }) }],
    });

    await predictionService.scoreUserPendingPredictions('u1', '2024');

    // prediction scored to 18 (perfect) and leaderboard upserted
    const scoredCall = (setDoc as jest.Mock).mock.calls.find(
      ([, d]) => d.status === 'scored'
    );
    expect(scoredCall[1].pointsEarned).toBe(18);
    const lbCall = (setDoc as jest.Mock).mock.calls.find(([, d]) => 'seasonPoints' in d);
    expect(lbCall[1].seasonPoints).toBe(18);
    expect(lbCall[1].racesPlayed).toBe(1);
  });

  test('pending race with no result yet is left pending', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ data: () => ({
        uid: 'u1', displayName: 'Ann', season: '2024', round: '2', raceId: '2024-2',
        p1: 'ver', p2: 'lec', p3: 'ham', status: 'pending', pointsEarned: null, createdAt: 'x',
      }) }],
    });
    (ergastService.getRaceResults as jest.Mock).mockResolvedValue([]); // no podium yet
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });

    await predictionService.scoreUserPendingPredictions('u1', '2024');
    const scoredCall = (setDoc as jest.Mock).mock.calls.find(([, d]) => d.status === 'scored');
    expect(scoredCall).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/unit/services/predictionService.test.ts --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/services/predictionService.ts`**

```typescript
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ergastService } from '@/services/ergastAPI';
import { scorePrediction } from '@/utils/scoring';
import { Prediction, LeaderboardEntry } from '@/types';

function predictionId(uid: string, season: string, round: string): string {
  return `${uid}_${season}_${round}`;
}

export class PredictionService {
  async savePrediction(input: {
    uid: string;
    displayName: string;
    season: string;
    round: string;
    raceId: string;
    p1: string;
    p2: string;
    p3: string;
  }): Promise<void> {
    const id = predictionId(input.uid, input.season, input.round);
    const prediction: Prediction = {
      uid: input.uid,
      season: input.season,
      round: input.round,
      raceId: input.raceId,
      p1: input.p1,
      p2: input.p2,
      p3: input.p3,
      displayName: input.displayName,
      createdAt: new Date().toISOString(),
      status: 'pending',
      pointsEarned: null,
    };
    await setDoc(doc(db, 'predictions', id), prediction);
  }

  async getUserPrediction(uid: string, season: string, round: string): Promise<Prediction | null> {
    const snap = await getDoc(doc(db, 'predictions', predictionId(uid, season, round)));
    return snap.exists() ? (snap.data() as Prediction) : null;
  }

  async getUserPredictions(uid: string, season: string): Promise<Prediction[]> {
    const q = query(
      collection(db, 'predictions'),
      where('uid', '==', uid),
      where('season', '==', season)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Prediction);
  }

  async scoreUserPendingPredictions(uid: string, season: string): Promise<void> {
    const all = await this.getUserPredictions(uid, season);
    const pending = all.filter((p) => p.status === 'pending');

    let scoredAny = false;
    for (const p of pending) {
      const results = await ergastService.getRaceResults(p.season, p.round);
      const podium = results
        .filter((r) => ['1', '2', '3'].includes(r.position))
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((r) => r.driver.driverId);
      if (podium.length < 3) continue; // race not finished / no result yet

      const score = scorePrediction(
        [p.p1, p.p2, p.p3],
        [podium[0], podium[1], podium[2]]
      );
      await setDoc(doc(db, 'predictions', predictionId(uid, p.season, p.round)), {
        ...p,
        status: 'scored',
        pointsEarned: score.total,
      });
      scoredAny = true;
    }

    if (scoredAny) {
      await this.updateLeaderboard(uid, season);
    }
  }

  private async updateLeaderboard(uid: string, season: string): Promise<void> {
    const all = await this.getUserPredictions(uid, season);
    const scored = all.filter((p) => p.status === 'scored');
    const seasonPoints = scored.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0);
    const displayName = all[0]?.displayName ?? 'Player';
    const entry: LeaderboardEntry = {
      uid,
      displayName,
      seasonPoints,
      racesPlayed: scored.length,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'leaderboard', uid), entry);
  }

  async getSeasonLeaderboard(): Promise<LeaderboardEntry[]> {
    const q = query(collection(db, 'leaderboard'), orderBy('seasonPoints', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LeaderboardEntry);
  }

  async getRaceLeaderboard(season: string, round: string): Promise<Prediction[]> {
    const q = query(
      collection(db, 'predictions'),
      where('season', '==', season),
      where('round', '==', round),
      where('status', '==', 'scored'),
      orderBy('pointsEarned', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Prediction);
  }
}

export const predictionService = new PredictionService();
```

- [ ] **Step 4: Run test + type-check**

Run: `npm test -- __tests__/unit/services/predictionService.test.ts --watchAll=false` → PASS
Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green

- [ ] **Step 5: Commit**

```bash
git add src/services/predictionService.ts __tests__/unit/services/predictionService.test.ts
git commit -m "feat: add prediction service with firestore crud and client scoring"
```

---

## Task 4: Redux slices (predictions + leaderboard)

**Files:**
- Create: `src/redux/slices/predictionsSlice.ts`
- Create: `src/redux/slices/leaderboardSlice.ts`
- Modify: `src/redux/store.ts`
- Create: `__tests__/integration/predictionsFlow.test.ts`

**Interfaces:**
- Consumes: `Prediction`, `LeaderboardEntry` (Task 1)
- Produces:
  - `predictionsSlice`: state `{ byRound: Record<string, Prediction>; loading: boolean; error: string | null }`; actions `setPredictions(Prediction[])`, `setPrediction(Prediction)`, `setPredictionsLoading(boolean)`, `setPredictionsError(string|null)`, `clearPredictions()`
  - `leaderboardSlice`: state `{ season: LeaderboardEntry[]; race: Prediction[]; loading: boolean; error: string | null }`; actions `setSeasonLeaderboard(LeaderboardEntry[])`, `setRaceLeaderboard(Prediction[])`, `setLeaderboardLoading(boolean)`, `setLeaderboardError(string|null)`

- [ ] **Step 1: Write the failing integration test**

```typescript
// __tests__/integration/predictionsFlow.test.ts
import { configureStore } from '@reduxjs/toolkit';
import predictionsReducer, {
  setPrediction,
  setPredictions,
  clearPredictions,
} from '@/redux/slices/predictionsSlice';
import leaderboardReducer, {
  setSeasonLeaderboard,
} from '@/redux/slices/leaderboardSlice';
import type { Prediction, LeaderboardEntry } from '@/types';

const mkPred = (round: string): Prediction => ({
  uid: 'u1', season: '2024', round, raceId: `2024-${round}`,
  p1: 'ver', p2: 'lec', p3: 'ham', displayName: 'Ann',
  createdAt: 'x', status: 'pending', pointsEarned: null,
});

describe('predictions + leaderboard slices', () => {
  const store = () =>
    configureStore({ reducer: { predictions: predictionsReducer, leaderboard: leaderboardReducer } });

  test('setPredictions indexes by round', () => {
    const s = store();
    s.dispatch(setPredictions([mkPred('1'), mkPred('2')]));
    expect(Object.keys(s.getState().predictions.byRound)).toEqual(['1', '2']);
  });

  test('setPrediction upserts one round', () => {
    const s = store();
    s.dispatch(setPrediction(mkPred('3')));
    expect(s.getState().predictions.byRound['3'].p1).toBe('ver');
  });

  test('clearPredictions empties state', () => {
    const s = store();
    s.dispatch(setPredictions([mkPred('1')]));
    s.dispatch(clearPredictions());
    expect(s.getState().predictions.byRound).toEqual({});
  });

  test('setSeasonLeaderboard stores entries', () => {
    const s = store();
    const entry: LeaderboardEntry = { uid: 'u1', displayName: 'Ann', seasonPoints: 18, racesPlayed: 1, updatedAt: 'x' };
    s.dispatch(setSeasonLeaderboard([entry]));
    expect(s.getState().leaderboard.season[0].seasonPoints).toBe(18);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/integration/predictionsFlow.test.ts --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/redux/slices/predictionsSlice.ts`**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Prediction } from '@/types';

interface PredictionsState {
  byRound: Record<string, Prediction>;
  loading: boolean;
  error: string | null;
}

const initialState: PredictionsState = { byRound: {}, loading: false, error: null };

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState,
  reducers: {
    setPredictions: (state, action: PayloadAction<Prediction[]>) => {
      state.byRound = {};
      for (const p of action.payload) state.byRound[p.round] = p;
    },
    setPrediction: (state, action: PayloadAction<Prediction>) => {
      state.byRound[action.payload.round] = action.payload;
    },
    setPredictionsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setPredictionsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearPredictions: (state) => {
      state.byRound = {};
      state.error = null;
    },
  },
});

export const {
  setPredictions,
  setPrediction,
  setPredictionsLoading,
  setPredictionsError,
  clearPredictions,
} = predictionsSlice.actions;
export default predictionsSlice.reducer;
```

- [ ] **Step 4: Implement `src/redux/slices/leaderboardSlice.ts`**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LeaderboardEntry, Prediction } from '@/types';

interface LeaderboardState {
  season: LeaderboardEntry[];
  race: Prediction[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = { season: [], race: [], loading: false, error: null };

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setSeasonLeaderboard: (state, action: PayloadAction<LeaderboardEntry[]>) => {
      state.season = action.payload;
    },
    setRaceLeaderboard: (state, action: PayloadAction<Prediction[]>) => {
      state.race = action.payload;
    },
    setLeaderboardLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLeaderboardError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSeasonLeaderboard,
  setRaceLeaderboard,
  setLeaderboardLoading,
  setLeaderboardError,
} = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
```

- [ ] **Step 5: Register both in `src/redux/store.ts`**

Add imports and `predictions: predictionsReducer`, `leaderboard: leaderboardReducer` to the `combineReducers` call (READ the current store.ts first; match the existing pattern; do NOT add to the persist whitelist).

- [ ] **Step 6: Run test + type-check**

Run: `npm test -- __tests__/integration/predictionsFlow.test.ts --watchAll=false` → PASS
Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green

- [ ] **Step 7: Commit**

```bash
git add src/redux/slices/predictionsSlice.ts src/redux/slices/leaderboardSlice.ts src/redux/store.ts __tests__/integration/predictionsFlow.test.ts
git commit -m "feat: add predictions and leaderboard redux slices"
```

---

## Task 5: DriverPicker + PredictionCard + LeaderboardRow components

**Files:**
- Create: `src/components/predict/DriverPicker.tsx`
- Create: `src/components/predict/PredictionCard.tsx`
- Create: `src/components/leaderboard/LeaderboardRow.tsx`
- Create: `__tests__/components/predict/DriverPicker.test.tsx`
- Create: `__tests__/components/leaderboard/LeaderboardRow.test.tsx`

**Interfaces:**
- Consumes: `@/components/ui` (`DriverBadge`, `SurfaceCard`, `PositionBadge`), `@/theme`, `Prediction`, `LeaderboardEntry`, `Driver`
- Produces:
  - `DriverPicker` (props: `drivers: Driver[]`, `selected: [string, string, string]`, `onChange: (slot: 0|1|2, driverId: string) => void`) — three slots; a driver chosen in another slot is disabled
  - `PredictionCard` (props: `prediction: Prediction`, `actualPodium?: [string, string, string]`) — shows the user's P1/P2/P3 and, if scored, the points + actual
  - `LeaderboardRow` (props: `rank: number`, `displayName: string`, `points: number`, `highlight?: boolean`)

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/components/leaderboard/LeaderboardRow.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';

describe('LeaderboardRow', () => {
  test('renders rank, name, and points', async () => {
    await render(<LeaderboardRow rank={1} displayName="Ann" points={42} />);
    expect(screen.getByText('Ann')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });
});
```

```typescript
// __tests__/components/predict/DriverPicker.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DriverPicker } from '@/components/predict/DriverPicker';
import type { Driver } from '@/types';

const drivers: Driver[] = [
  { driverId: 'ver', code: 'VER', givenName: 'Max', familyName: 'Verstappen', dob: '', nationality: '', url: '' },
  { driverId: 'lec', code: 'LEC', givenName: 'Charles', familyName: 'Leclerc', dob: '', nationality: '', url: '' },
];

describe('DriverPicker', () => {
  test('renders the three position slots', async () => {
    await render(
      <DriverPicker drivers={drivers} selected={['', '', '']} onChange={() => {}} />
    );
    expect(screen.getByText('P1')).toBeTruthy();
    expect(screen.getByText('P2')).toBeTruthy();
    expect(screen.getByText('P3')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- __tests__/components/predict/ __tests__/components/leaderboard/ --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement the three components**

`LeaderboardRow.tsx` — a row: `PositionBadge rank`, initials avatar (reuse `DriverBadge` with the name's initials), display name (flex), points (heading font). `highlight` → crimson-tinted background. Use `@/theme` tokens + `SCREEN_GUTTER`.

`DriverPicker.tsx` — three labeled rows "P1"/"P2"/"P3"; each renders a horizontal scroll of the `drivers` as selectable chips (`DriverBadge` + familyName). Tapping a driver calls `onChange(slot, driverId)`. A driver selected in another slot is shown disabled. Track nothing internally — it's controlled via `selected`.

`PredictionCard.tsx` — a `SurfaceCard` showing the round, the user's P1/P2/P3 (as `DriverBadge`s), and — when `prediction.status === 'scored'` — the `pointsEarned` (accent) and, if `actualPodium` given, the actual podium for comparison.

(Full component code follows the existing design-system conventions used in `src/components/analytics/*` and `src/components/race/*` — dark tokens, `SurfaceCard`, `DriverBadge`, `PositionBadge`. Keep each file focused and typed.)

- [ ] **Step 4: Run tests + type-check**

Run: `npm test -- __tests__/components/predict/ __tests__/components/leaderboard/ --watchAll=false` → PASS
Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green

- [ ] **Step 5: Commit**

```bash
git add src/components/predict/ src/components/leaderboard/ __tests__/components/predict/ __tests__/components/leaderboard/
git commit -m "feat: add driver picker, prediction card, and leaderboard row components"
```

---

## Task 6: MakePredictionScreen + LeaderboardScreen

**Files:**
- Create: `src/screens/predict/MakePredictionScreen.tsx`
- Create: `src/screens/leaderboard/LeaderboardScreen.tsx`
- Modify: `src/navigation/types.ts`

**Interfaces:**
- Consumes: `DriverPicker`, `LeaderboardRow`, `predictionService`, `validatePodium`, `isPredictionOpen`, Redux hooks/slices, `@/components/ui`, `BackButton`
- Produces: two default-exported screens + `MakePrediction` / `Leaderboard` routes in `RootStackParamList`

- [ ] **Step 1: Add routes to `src/navigation/types.ts`**

Add to `RootStackParamList`:
```typescript
  MakePrediction: { season: string; round: string; raceId: string };
  Leaderboard: undefined;
```

- [ ] **Step 2: Implement `MakePredictionScreen.tsx`**

- Route params `{ season, round, raceId }`. `ScreenContainer` + `BackButton`.
- Drivers from `state.drivers.drivers` (fallback: derive from `state.standings.driverStandings`).
- Local `selected: [string,string,string]`, initialized from the user's existing prediction if any (`predictionService.getUserPrediction`).
- `DriverPicker` for selection. Submit button calls `validatePodium`; on invalid show the error; on valid call `predictionService.savePrediction({ uid, displayName, season, round, raceId, p1, p2, p3 })`, dispatch `setPrediction`, then `navigation.goBack()`.
- Guard: if `!isPredictionOpen(...)` show a locked message and disable submit (pass the race `date`/`time` via a lookup of the race in `state.races.allRaces` by round).
- Requires `state.auth.user`; if absent, prompt to log in.

- [ ] **Step 3: Implement `LeaderboardScreen.tsx`**

- `ScreenContainer` + `BackButton`. `SegmentedButtons` "Season" / "This Race".
- Season: on mount dispatch loading, `predictionService.getSeasonLeaderboard()` → `setSeasonLeaderboard`; render `LeaderboardRow` per entry (rank = index+1, highlight when `entry.uid === state.auth.user?.uid`).
- This Race: use the latest/most-recent finished round (from `state.races` selected season + a sensible current round; if none selected use the last race). `predictionService.getRaceLeaderboard(season, round)` → `setRaceLeaderboard`; render rows from `pointsEarned`.
- Empty states for no data.

- [ ] **Step 4: Verify**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green

- [ ] **Step 5: Commit**

```bash
git add src/screens/predict/MakePredictionScreen.tsx src/screens/leaderboard/ src/navigation/types.ts
git commit -m "feat: add make-prediction and leaderboard screens"
```

---

## Task 7: PredictScreen (new tab) + navigation wiring + scoring on open

**Files:**
- Create: `src/screens/predict/PredictScreen.tsx`
- Modify: `src/navigation/types.ts` (HomeTabParamList)
- Modify: `src/navigation/HomeNavigator.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `predictionService`, `PredictionCard`, Redux hooks, `@/components/ui`, `MakePrediction`/`Leaderboard` routes (Task 6)
- Produces: `Predict` tab + registered `MakePrediction` + `Leaderboard` stack screens

- [ ] **Step 1: Add `Predict` to `HomeTabParamList`** in `src/navigation/types.ts`:
```typescript
  Predict: undefined;
```

- [ ] **Step 2: Implement `PredictScreen.tsx`**

- `ScreenContainer`. Requires `state.auth.user`; if not logged in, show a prompt with a button to `navigation.navigate('Login')`.
- On mount (logged in): call `predictionService.scoreUserPendingPredictions(uid, season)` then `predictionService.getUserPredictions(uid, season)` → dispatch `setPredictions`. (Wrap in try/catch → error state; local loading with `Skeleton`.)
- **Next race:** find the next upcoming race from `state.races.allRaces` (first race whose lock time > now). Show a card: flag, name, countdown to lock, and the user's current pick (from `state.predictions.byRound[round]`) or a "Make Prediction" CTA → `navigation.navigate('MakePrediction', { season, round, raceId })`. If locked, show the pick read-only with 🔒.
- **Recent predictions:** scored predictions (from state) rendered with `PredictionCard`.
- **Leaderboard button** → `navigation.navigate('Leaderboard')`.

- [ ] **Step 3: Add the Predict tab to `HomeNavigator.tsx`**

Import `PredictScreen`; add a `<Tab.Screen name="Predict" component={PredictScreen} options={{ title: 'Predict' }} />`; add its icon to the `tabBarIcon` switch (e.g. `podium`/`trophy-outline` → use `'flag'`/`'flag-outline'` or `'trophy'`/`'trophy-outline'`; Standings already uses trophy, so use `'flag'`/`'flag-outline'` for Predict).

- [ ] **Step 4: Register stack screens in `RootNavigator.tsx`**

Import `MakePredictionScreen` + `LeaderboardScreen`; add `<Stack.Screen name="MakePrediction" .../>` and `<Stack.Screen name="Leaderboard" .../>` with `headerShown: false` (custom BackButton is inside the screens), matching the existing pattern.

- [ ] **Step 5: Verify (bundle check — new screens + Firestore queries)**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green
Run: `npx expo export --platform android 2>&1 | tail -5` → bundles cleanly; then `rm -rf dist`. If it fails, report BLOCKED with the error.

- [ ] **Step 6: Commit**

```bash
git add src/screens/predict/PredictScreen.tsx src/navigation/
git commit -m "feat: add predict tab with scoring-on-open and navigation wiring"
```

---

## Task 8: Firestore rules doc + verification

**Files:**
- Create: `firestore.rules`
- Modify: `README.md` (a short "Firestore setup" note)

- [ ] **Step 1: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles (Phase 3A)
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    // Predictions (Phase 3B)
    match /predictions/{id} {
      allow read: if true;
      allow create, update: if request.auth != null
        && request.resource.data.uid == request.auth.uid;
      allow delete: if false;
    }
    // Leaderboard (Phase 3B)
    match /leaderboard/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

- [ ] **Step 2: Add a "Firestore setup" note to `README.md`**

Explain: copy `firestore.rules` into Firebase Console → Firestore → Rules → Publish. Note the documented client-side-scoring trade-offs (deadline + score integrity) and that a Cloud Function (Blaze) is the upgrade path.

- [ ] **Step 3: Full verification**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green
Run: `npm run lint 2>&1 | tail -3` → 0 errors (warnings ok)
Run: `npx expo export --platform android 2>&1 | tail -5` → bundles cleanly; then `rm -rf dist`

- [ ] **Step 4: Commit**

```bash
git add firestore.rules README.md
git commit -m "docs: add firestore security rules and setup note for predictions"
```

---

## Success Criteria

- Signed-in users predict a race podium before lock, edit until lock, see it locked after
- Opening the Predict tab scores the user's finished-race predictions against real jolpica results
- Season + per-race leaderboards rank users; the user's own row is highlighted
- Owner-only Firestore writes; rules committed to `firestore.rules`; trade-offs documented
- Type-check clean, full test suite green (127 + new), lint 0 errors, Android bundle exports
- New "Predict" tab + Leaderboard match the dark design system

## On-Device Checklist (manual)

- Log in → Predict tab shows the next race with a "Make Prediction" CTA
- Make a podium pick on a past/finished race → reopen Predict → it scores against the real result
- Leaderboard shows your points; your row highlighted; Season/This Race toggle works
- Not-logged-in Predict tab shows the login prompt
