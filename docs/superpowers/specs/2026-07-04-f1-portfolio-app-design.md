# F1 Portfolio App - Design Specification

**Date:** 2026-07-04  
**Status:** Approved  
**Owner:** Portfolio Project  

---

## Executive Summary

A React Native portfolio app showcasing a professional F1 racing statistics and community platform. Built in 4 phases, starting with real-time performance data and expanding to driver analytics, community features, and educational content. Demonstrates full-stack React Native expertise, state management, API integration, real-time data handling, and backend integration.

**Tech Stack:** React Native + Expo (TypeScript), Redux Toolkit, Firebase, Ergast F1 API, React Navigation, Skia for visualizations

---

## Project Goals

1. **Portfolio Showcase** – Demonstrate React Native, TypeScript, architecture, and full-stack skills
2. **Deployable MVP** – Phase 1 alone is production-ready and shareable
3. **Scalable Architecture** – Clean separation of concerns, easy to extend to Phases 2-4
4. **Professional Quality** – Testing, error handling, performance optimization

---

## Architecture Overview

**Layered Architecture with Clear Separation:**

```
┌─────────────────────────────────────┐
│     React Native UI Layer (Expo)    │
│  (Screens, Components, Navigation)  │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   State Management (Redux + Persist)│
│     (Global data, caching)          │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     Data Service Layer (TypeScript) │
│  (API abstraction, transformations) │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   Ergast F1 API + Local Persistence │
│  (AsyncStorage, real-time caching)  │
└─────────────────────────────────────┘
```

**Key Design Principles:**
- API abstraction layer for easy mocking and testing
- Redux for predictable global state
- Service layer handles all business logic
- Screens are dumb consumers of state and actions
- TypeScript throughout for type safety

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React Native + Expo | Cross-platform mobile (iOS/Android) |
| **Language** | TypeScript | Type safety, better DX |
| **State Management** | Redux Toolkit + Redux Persist | Predictable state, offline support |
| **API Client** | Axios + Service Layer | Type-safe API abstraction |
| **Persistence** | AsyncStorage | Local caching, offline support |
| **Navigation** | React Navigation | Bottom tabs + stack navigation |
| **UI Components** | React Native Paper | Material Design consistency |
| **Visualizations** | Skia for React Native | High-performance charts |
| **Testing** | Jest + React Native Testing Library | Unit, component, integration tests |
| **Backend** | Firebase (Phase 3+) | Authentication, Firestore, real-time sync |
| **External API** | Ergast F1 API | Race data source |
| **Code Quality** | ESLint + Prettier | Consistent formatting, linting |

---

## Phase Breakdown

### **PHASE 1: Real-Time Performance & Stats (6-8 weeks)**

**Objective:** Build the visual foundation with live race data, standings, and results.

**Features:**
- Races/Calendar screen with upcoming/past races
- Live driver and constructor standings
- Qualifying results with lap times
- Race results with comprehensive data
- Search and filter capabilities
- Driver quick-stats cards

**Key Screens:**
- `HomeScreen` – Latest race overview, featured stats
- `CalendarScreen` – Season calendar with race list
- `StandingsScreen` – Championship tables (drivers & constructors)
- `RaceDetailsScreen` – Full race info, results, qualifying data

**Reusable Components:**
- `RaceCard` – Race overview with date, location, countdown
- `DriverRow` – Driver entry with animations
- `ConstructorRow` – Team standings row
- `LapTimeTable` – Qualifying/practice times
- `ResultsTable` – Race results with status indicators
- `StatCard` – Quick stats badge

**Data Models:**
```typescript
interface Driver {
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  dob: string;
  nationality: string;
}

interface Race {
  raceId: string;
  season: number;
  round: number;
  raceName: string;
  date: string;
  time: string;
  circuit: Circuit;
  results: RaceResult[];
}

interface RaceResult {
  position: number;
  driver: Driver;
  constructor: Constructor;
  points: number;
  laps: number;
  status: string;
  fastestLap?: FastestLap;
}

interface StandingsTable {
  season: number;
  round: number;
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
}
```

**State Management (Redux):**
```
store/
├── slices/
│   ├── racesSlice.ts
│   ├── standingsSlice.ts
│   ├── resultsSlice.ts
│   ├── driversSlice.ts
│   └── uiSlice.ts
├── services/
│   └── ergastAPI.ts
└── store.ts (with persist middleware)
```

**API Service Layer:**
```typescript
class ErgastService {
  async getCurrentSeason(): Promise<Season>
  async getRacesByYear(year: number): Promise<Race[]>
  async getLiveResults(season: number, round: number): Promise<RaceResult[]>
  async getStandings(season: number, round?: number): Promise<StandingsTable>
  async getDriver(driverId: string): Promise<DriverDetails>
  async getQualifying(season: number, round: number): Promise<QualifyingResult[]>
}
```

**Caching & Real-Time:**
- AsyncStorage caches latest races, standings, driver data
- Smart polling (30-sec intervals during active race)
- Redux Persist for offline support
- Graceful error handling with retry logic

**Animations:**
- Skeleton loaders while fetching
- Fade-in for tables
- Slide transitions for standings changes
- Smooth screen transitions

**Testing:**
- Unit tests for API service (mocked Axios)
- Component tests for `RaceCard`, `DriverRow`, `StandingsTable`
- Integration tests for race flow
- Snapshot tests for critical screens

**Success Criteria:**
- All Phase 1 features functional
- Offline support works (cached data displays)
- Tests pass with >80% coverage
- App runs smoothly on iOS and Android
- Handles network errors gracefully

---

### **PHASE 2: Driver Analysis (3-4 weeks)**

**Objective:** Add analytics and comparison features showcasing data processing skills.

**Features:**
- Driver performance dashboard (career stats, trends)
- Head-to-head driver comparisons
- Trend analysis (season-by-season performance)
- Constructor performance metrics
- Advanced filtering and insights
- Driver career timeline

**New Screens:**
- `DriverDetailScreen` – Full career dashboard
- `HeadToHeadScreen` – Compare 2 drivers side-by-side
- `TrendAnalysisScreen` – Historical performance charts
- `ConstructorAnalysisScreen` – Team stats

**Components:**
- `DriverDashboard` – Main profile + stats
- `HeadToHeadCard` – Comparison widget
- `TrendChart` – Line charts (Skia-based)
- `StatGrid` – Career stats layout
- `MilestoneTimeline` – Driver career events
- `ConstructorComparison` – Team metrics

**Data Models:**
```typescript
interface DriverStats {
  driverId: string;
  totalRaces: number;
  wins: number;
  podiums: number;
  polePositions: number;
  pointsTotal: number;
  avgPoints: number;
  avgFinish: number;
  dnfRate: number;
  bestSeason: Season;
  firstRace: Race;
  lastRace: Race;
}

interface HeadToHeadComparison {
  driver1: DriverStats;
  driver2: DriverStats;
  racesMet: Race[];
  h2hRecord: { driver1Wins: number; driver2Wins: number };
  pointsPerRaceAvg: { driver1: number; driver2: number };
}

interface TrendData {
  seasonByYear: {
    season: number;
    points: number;
    wins: number;
    podiums: number;
    position: number;
  }[];
}
```

**Service Layer Extension:**
```typescript
class AnalyticsService {
  async getDriverStats(driverId: string): Promise<DriverStats>
  async compareDrivers(driverId1: string, driverId2: string): Promise<HeadToHeadComparison>
  async getTrendData(driverId: string): Promise<TrendData>
  async getConstructorAnalytics(constructorId: string): Promise<ConstructorStats>
  calculatePerformanceMetrics(driver: Driver): PerformanceMetrics
}
```

**State Management Extension:**
```
store/slices/
├── driverAnalyticsSlice.ts
├── trendsSlice.ts
└── favoritesSlice.ts
```

**Visualizations:**
- Line charts for season progression
- Bar charts for wins/podiums by season
- Pie charts for DNF breakdown
- Comparison widgets with animated transitions

**Success Criteria:**
- All analytics features calculate correctly
- Charts render smoothly on all devices
- Comparisons are accurate and performant
- Tests cover analytics logic

---

### **PHASE 3: Community Features (4-6 weeks)**

**Objective:** Add backend integration, real-time sync, and social features.

**Features:**
- User authentication (Firebase Auth)
- Race predictions system
- Prediction leaderboard with scoring
- Discussion forums per race
- User profiles and prediction history
- Comments, likes, and reactions
- Real-time notifications

**New Screens:**
- `LoginScreen` – Authentication UI
- `ProfileScreen` – User stats and profile
- `PredictionsScreen` – Make predictions, view accuracy
- `LeaderboardScreen` – Global rankings
- `ForumsScreen` – Race discussions
- `ThreadScreen` – Full thread with comments
- `OtherUserProfileScreen` – View other users

**Components:**
- `LoginForm` – Auth UI
- `UserProfileCard` – User info
- `PredictionForm` – Make predictions
- `PredictionCard` – Past predictions
- `LeaderboardTable` – Ranked users
- `ForumThread` – Thread display
- `CommentList` – Comments with reactions
- `NotificationBell` – Notifications

**Data Models:**
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  favoriteDriver?: string;
  favoriteTeam?: string;
  joinDate: Date;
  predictionStats: PredictionStats;
}

interface Prediction {
  predictionId: string;
  userId: string;
  raceId: string;
  predictedWinner: Driver;
  predictedPodium: Driver[];
  predictedPolePosition: Driver;
  status: 'pending' | 'correct' | 'incorrect';
  pointsEarned: number;
  createdAt: Date;
}

interface ForumThread {
  threadId: string;
  raceId: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  comments: ForumComment[];
  likes: number;
}

interface ForumComment {
  commentId: string;
  threadId: string;
  userId: string;
  content: string;
  createdAt: Date;
  likes: number;
}

interface PredictionStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalPoints: number;
  currentSeason: { points: number; rank: number };
  allTimeRank: number;
}
```

**Backend: Firebase**
- **Firestore:** Real-time database (users, predictions, forums)
- **Firebase Auth:** Email/password authentication
- **Cloud Functions:** Auto-score predictions on race completion
- **Security Rules:** User data isolation

**Service Layer Extension:**
```typescript
class FirebaseService {
  async signUp(email: string, password: string): Promise<User>
  async login(email: string, password: string): Promise<User>
  async logout(): Promise<void>
  async makePrediction(raceId: string, prediction: Prediction): Promise<void>
  async getPredictions(userId: string): Promise<Prediction[]>
  async getLeaderboard(season: number): Promise<LeaderboardEntry[]>
  async createThread(raceId: string, thread: ForumThread): Promise<void>
  async getThreads(raceId: string): Promise<ForumThread[]>
  async addComment(threadId: string, comment: ForumComment): Promise<void>
}
```

**State Management Extension:**
```
store/slices/
├── authSlice.ts
├── predictionsSlice.ts
├── forumsSlice.ts
└── usersSlice.ts
```

**Real-Time Features:**
- Live leaderboard updates during races
- Auto-scoring predictions
- Live forum comments
- Push notifications

**Testing:**
- Firebase emulator for local testing
- Auth flow tests
- Prediction scoring logic tests
- Real-time sync tests

**Success Criteria:**
- Authentication works
- Predictions are accurate
- Leaderboard updates in real-time
- Forums allow discussions
- Notifications are reliable

---

### **PHASE 4: Educational Deep-Dives (Ongoing)**

**Objective:** Add educational content to help users understand F1 better.

**Features:**
- Onboarding tutorial ("How to Read an F1 Race")
- Racing fundamentals (DRS, tyre strategy, pit stops)
- Track guides with circuit diagrams
- Strategy explainers (interactive)
- Career paths and milestones
- F1 glossary with visual explanations
- Historic races explained

**New Screen:**
- `LearnTab` – Main education hub
- `TutorialScreen` – Step-by-step guides
- `TrackGuideScreen` – Track-specific info
- `StrategyExplainerScreen` – Interactive explanations
- `HistoricRaceScreen` – Race breakdowns
- `GlossaryScreen` – F1 terms

**Components:**
- `TutorialStep` – Step-by-step guide with animations
- `CircuitDiagram` – Visual track layout
- `InteractiveExplainer` – Animated strategy explanation
- `GlossaryCard` – Term definitions
- `HistoricRaceCard` – Race summary card

**Content Structure:**
```
learn/
├── onboarding/ (interactive tutorial)
├── fundamentals/
│   ├── drs.md
│   ├── tyres.md
│   ├── pit-stops.md
│   └── safety-car.md
├── tracks/ (one per circuit)
│   ├── monaco.md
│   ├── silverstone.md
│   └── ...
├── strategy/ (interactive explainers)
│   ├── fuel-management.md
│   ├── tire-degradation.md
│   └── weather-strategy.md
└── glossary.json
```

**Data Models:**
```typescript
interface Guide {
  id: string;
  title: string;
  category: 'fundamentals' | 'tracks' | 'strategy' | 'career';
  content: string; // markdown
  readingTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface Track {
  trackId: string;
  name: string;
  location: string;
  circuitLength: number;
  lapRecord: LapRecord;
  overtakingZones: string[];
  diagram: string; // SVG
}

interface GlossaryTerm {
  term: string;
  definition: string;
  example: string;
  relatedTerms: string[];
}
```

**Content Format:**
- Markdown for guides
- JSON for data (glossary, records)
- SVG for diagrams
- Video embeds optional

**Success Criteria:**
- All guides render correctly
- Search/filter works in glossary
- Content is accurate and clear
- Beginner-friendly explanations

---

## Project Structure

```
F1-Portfolio-App/
├── app/ (Expo entry point)
│   └── index.tsx
├── src/
│   ├── screens/
│   │   ├── home/
│   │   ├── calendar/
│   │   ├── standings/
│   │   ├── driver-details/ (Phase 2)
│   │   ├── auth/ (Phase 3)
│   │   ├── predictions/ (Phase 3)
│   │   ├── forums/ (Phase 3)
│   │   └── learn/ (Phase 4)
│   ├── components/
│   │   ├── common/
│   │   ├── race/
│   │   ├── driver/ (Phase 2)
│   │   ├── community/ (Phase 3)
│   │   └── education/ (Phase 4)
│   ├── redux/
│   │   ├── slices/
│   │   ├── services/
│   │   ├── store.ts
│   │   └── hooks.ts
│   ├── services/
│   │   ├── ergastAPI.ts
│   │   ├── analyticsService.ts (Phase 2)
│   │   ├── firebaseService.ts (Phase 3)
│   │   └── notificationService.ts (Phase 3)
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── navigation/
│       ├── RootNavigator.tsx
│       ├── HomeNavigator.tsx
│       └── types.ts
├── learn/ (Phase 4 content)
│   ├── fundamentals/
│   ├── tracks/
│   ├── strategy/
│   └── glossary.json
├── __tests__/
│   ├── unit/
│   ├── components/
│   └── integration/
├── app.json (Expo config)
├── package.json
├── tsconfig.json
├── eslintrc.json
├── prettier.config.js
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    └── superpowers/specs/ (this file)
```

---

## Error Handling & Edge Cases

**API Failures:**
- Retry logic with exponential backoff
- Fallback to cached data
- User-friendly error messages
- Offline mode with cached data

**Authentication Errors:**
- Session validation
- Token refresh logic
- Logout on auth failure
- Redirect to login

**Real-Time Sync Issues:**
- Debouncing rapid updates
- Conflict resolution for concurrent edits
- Network state monitoring
- Graceful degradation

---

## Testing Strategy

**Phase 1:**
- Unit tests for API service (>80% coverage)
- Component tests for race cards, standings tables
- Integration tests for data flow
- Snapshot tests for screens

**Phase 2:**
- Analytics calculation tests
- Comparison logic tests
- Chart rendering tests

**Phase 3:**
- Firebase emulator tests
- Auth flow tests
- Prediction scoring tests
- Real-time sync tests

**Phase 4:**
- Content rendering tests
- Search/filter tests

---

## Performance Considerations

- **Lazy Loading:** Screens and data loaded on-demand
- **Memoization:** React.memo for expensive components
- **Virtualization:** FlatList for long lists
- **Skia:** High-performance charts
- **Caching:** Redux Persist + AsyncStorage
- **Code Splitting:** Separate bundles per phase (optional)

---

## Deployment & Distribution

**Phase 1:**
- Build for iOS (TestFlight) and Android (Google Play Beta)
- GitHub repository (public portfolio)
- Expo Share link for quick testing

**Phase 3+:**
- Deploy to App Stores
- Firebase backend live
- CI/CD pipeline (GitHub Actions)

---

## Portfolio Impact

| Phase | Skills Demonstrated |
|-------|-------------------|
| **Phase 1** | React Native, Expo, TypeScript, API integration, animations, state management |
| **Phase 2** | Data visualization, analytics, performance optimization, complex calculations |
| **Phase 3** | Full-stack development, Firebase, real-time sync, authentication, backend design |
| **Phase 4** | Content management, UX/design thinking, educational clarity |

---

## Success Criteria (Overall)

- ✅ All phases built and functional
- ✅ Clean, professional code (TypeScript, ESLint, Prettier)
- ✅ >80% test coverage
- ✅ Offline support works
- ✅ Smooth animations and transitions
- ✅ Published on App Stores or shareable via Expo
- ✅ GitHub repository with clear documentation
- ✅ README with screenshots and feature walkthrough

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|-----------|
| Phase 1 | 6-8 weeks | 6-8 weeks |
| Phase 2 | 3-4 weeks | 9-12 weeks |
| Phase 3 | 4-6 weeks | 13-18 weeks |
| Phase 4 | Ongoing | 18+ weeks |

**MVP (Phase 1) ready:** 6-8 weeks  
**Full project:** 4-5 months

---

## Next Steps

1. ✅ Design approved
2. ⏳ Create implementation plan (Phase 1 details)
3. ⏳ Set up project scaffolding
4. ⏳ Begin Phase 1 development
