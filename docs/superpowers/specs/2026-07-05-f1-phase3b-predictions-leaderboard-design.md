# Phase 3B: Race Predictions + Leaderboard — Design Spec

**Date:** 2026-07-05
**Status:** Approved
**Owner:** Shubham Phatale

---

## Goal

Let signed-in users predict each race's podium (P1/P2/P3) before the race starts, auto-score their predictions against real jolpica results when they open the app, and rank users on a season-long and per-race leaderboard. Backend is the existing Firebase (Auth + Firestore from Phase 3A). Client-side scoring only (no Cloud Functions / Blaze plan).

## Non-Goals

- No Cloud Functions / server-side scoring (free Spark plan)
- No friend groups / private leagues (global leaderboard only)
- No predictions beyond the podium (winner-only, pole, fastest lap are out of scope)
- No push notifications (that's Phase 3D)

---

## Decisions (locked)

| Topic | Decision |
|-------|----------|
| What users predict | Podium: **P1, P2, P3** (three distinct drivers) |
| Scoring | Exact + partial credit (see table) |
| Deadline | Prediction locks at **race start** (race `date` + `time` from jolpica) |
| Leaderboard | **Season cumulative** + **per-race** |
| Scoring trigger | **Client scores only its own** predictions on app open (Firestore rules: owner-only writes) |
| Auth | Predictions require login (reuse Phase 3A auth) |
| Navigation | New **"Predict" bottom tab** (5 tabs total) + Leaderboard as a stack screen |

---

## Scoring Rules

Each of the 3 picks is scored independently, then a perfect-podium bonus is added.

| Outcome | Points |
|---------|--------|
| Driver in the **exact** predicted position | **+5** |
| Driver on the **podium** but **wrong** spot | **+2** |
| Driver **not** on the podium | 0 |
| **Perfect podium** (all 3 exact) | **+3 bonus** |

- Max per race = **18** (5×3 + 3).
- Near-miss example (right 3 drivers, P2/P3 swapped): 5 + 2 + 2 = **9**.
- Scoring function is pure and unit-tested; it takes the predicted `[p1,p2,p3]` and the actual podium `[a1,a2,a3]` (driverIds) and returns the point breakdown + total.

---

## Firestore Data Model

```
predictions/{uid}_{season}_{round}
  ├── uid: string
  ├── season: string
  ├── round: string
  ├── raceId: string
  ├── p1: string            (driverId)
  ├── p2: string            (driverId)
  ├── p3: string            (driverId)
  ├── displayName: string   (denormalized for per-race leaderboard rows)
  ├── createdAt: string     (ISO)
  ├── status: 'pending' | 'scored'
  └── pointsEarned: number | null

leaderboard/{uid}           (one doc per user, public-readable)
  ├── uid: string
  ├── displayName: string
  ├── seasonPoints: number  (sum of scored predictions in the current season)
  ├── racesPlayed: number
  └── updatedAt: string     (ISO)
```

**Doc id** for predictions is deterministic `{uid}_{season}_{round}` so a user has exactly one prediction per race (upsert on edit).

- **Season leaderboard** = read `leaderboard` collection, order by `seasonPoints` desc.
- **Per-race leaderboard** = query `predictions` where `season == S && round == R && status == 'scored'`, order by `pointsEarned` desc. `displayName` is denormalized onto the prediction so a row needs no extra lookup.

---

## Scoring Flow (client scores its own)

On app open (and when the Predict screen mounts), for the signed-in user:
1. Load the user's `pending` predictions.
2. For each, check whether that race has finished — the race's actual podium exists in jolpica (`getRaceResults(season, round)` returns positions 1–3).
3. If finished: compute `pointsEarned` with the scoring function, write `{ status: 'scored', pointsEarned }` to the prediction doc.
4. Recompute the user's `leaderboard/{uid}` doc: `seasonPoints` = sum of the user's scored predictions this season, `racesPlayed` = count. Upsert it.
5. A user only ever writes their own `predictions/*` and `leaderboard/{uid}` docs.

Deadline: the client refuses to create/edit a prediction once `now >= race start (date+time)`.

---

## Screens & Navigation

Add a 5th bottom tab **"Predict"** (target/flag icon). All dark-themed via the existing design system (`@/components/ui`, `@/theme`).

### PredictScreen (new tab)
- **Not logged in:** prompt with a "Log In" button (navigates to existing `Login`).
- **Logged in:**
  - **Next race card** — flag, race name, **countdown to lock**, and either your current pick (P1/P2/P3 as `DriverBadge`s) with an "Edit" action (if open) or a "Make Prediction" CTA. If locked, show 🔒 + your submitted pick (read-only).
  - **Your recent predictions** — finished races showing your pick vs the actual podium and `pointsEarned` (dark cards, podium colors, `PositionBadge`).
  - **"Leaderboard" button** → `LeaderboardScreen`.

### MakePredictionScreen (stack, params `{ season, round, raceId }`)
- Three ordered slots **P1 / P2 / P3**. Pick from the season's drivers (`state.drivers` / standings). A driver already chosen in another slot is disabled. `DriverBadge` + team color + name.
- Submit → `predictionService.savePrediction(...)` (upsert). Blocked if past the deadline (shows a message).
- Editable until lock.

### LeaderboardScreen (stack)
- **Season / This Race** `SegmentedButtons`.
- Ranked rows: `PositionBadge` (rank), initials avatar (`DriverBadge` style), display name, points. The current user's row is highlighted with the crimson accent.
- Season view reads `leaderboard`; This Race view reads scored `predictions` for the current/selected round.

### Navigation
- `HomeTabParamList` gains `Predict: undefined`.
- `RootStackParamList` gains `MakePrediction: { season: string; round: string; raceId: string }` and `Leaderboard: undefined`.
- Both new stack screens use the custom floating `BackButton` (no app bar), consistent with the current design.

---

## New Files (proposed)

```
src/types/index.ts                         + Prediction, LeaderboardEntry, PodiumScore types
src/services/predictionService.ts          Firestore CRUD + scoring orchestration
src/utils/scoring.ts                       pure scorePrediction() function
src/redux/slices/predictionsSlice.ts       user predictions + next-race pick state
src/redux/slices/leaderboardSlice.ts       season + per-race leaderboard data
src/screens/predict/PredictScreen.tsx      the Predict tab
src/screens/predict/MakePredictionScreen.tsx
src/screens/leaderboard/LeaderboardScreen.tsx
src/components/predict/PredictionCard.tsx   your pick vs actual + points
src/components/predict/DriverPicker.tsx     slot picker used by MakePrediction
src/components/leaderboard/LeaderboardRow.tsx
firestore.rules                            security rules (documented; applied in Firebase console)
```

---

## Security Rules & Integrity (honest trade-offs)

```
match /predictions/{id} {
  allow read: if true;                                  // per-race leaderboard needs public read
  allow create, update: if request.auth != null
                        && request.resource.data.uid == request.auth.uid;
  allow delete: if false;
}
match /leaderboard/{uid} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == uid;
}
```

**Enforced:** ownership — a user can only write their own prediction and leaderboard docs.

**Known limitations of client-side scoring (accepted for a personal/portfolio app):**
1. **Deadline** is enforced client-side only — Firestore rules can't know the race start time, so a determined user could submit late. Acceptable here.
2. **Score integrity** — the client computes its own `pointsEarned`; rules can't verify it against jolpica, so a malicious user could write a fake score. True anti-cheat requires a Cloud Function (Blaze plan) — documented as the upgrade path, out of scope now.

These are written down deliberately, not hidden.

---

## Testing

- **Unit — `scoring.ts`:** exact/partial/bonus/near-miss/no-hit cases; max = 18; near-miss = 9.
- **Unit — deadline + validation:** locks at race start; rejects duplicate drivers / fewer than 3 picks.
- **Service — `predictionService`** (mock Firestore + mock ergast/jolpica): save/get prediction, score pending against a mocked podium, upsert leaderboard.
- **Redux:** predictions + leaderboard slices (initial state, actions).
- **Component (RTL 14 async):** `DriverPicker` (slot selection, disable already-picked), `LeaderboardRow` (renders rank/name/points).
- Full suite stays green (127 baseline + new); `npm run type-check` clean; `npx expo export --platform android` bundles cleanly.
- On-device: make a prediction on an already-finished race → confirm it scores against real jolpica results and updates the leaderboard.

---

## Architecture Notes / Risks

- **Reuse existing services:** `ergastService.getRaceResults(season, round)` provides the actual podium; `firebaseService` patterns + `db` from `@/config/firebase` for Firestore; auth state from `state.auth`.
- **Firestore serializable state:** Redux holds plain objects only (no Timestamps — store ISO strings).
- **Deadline source:** race `date` + optional `time` (UTC) → a JS Date; if `time` missing, treat lock as start of that day (documented).
- **Empty/first-run:** empty leaderboard and no-predictions states render friendly empty views (no crashes — the `SmartImage`/guard lessons from the design phase apply).
- **The user must add the Firestore rules** in the Firebase console (the app can't set them); the repo documents them in `firestore.rules`.

---

## Success Criteria

- Signed-in users can predict a race podium before lock, edit until lock, and see it locked after.
- Opening the app scores the user's finished-race predictions against real jolpica results.
- Season + per-race leaderboards rank users; the user's own row is highlighted.
- Owner-only Firestore writes; documented trade-offs for deadline/score integrity.
- Type-check clean, full test suite green, Android bundle exports.
- New "Predict" tab + Leaderboard screen match the dark design system.
