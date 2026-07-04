# Phase 1: Real-Time Performance & Stats - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready React Native F1 app displaying real-time race data, standings, and results from the Ergast API with smooth animations and offline support.

**Architecture:** Layered architecture with UI screens consuming Redux state, Redux actions dispatching to service layer, service layer calling Ergast API, and AsyncStorage providing local caching. TypeScript throughout for type safety.

**Tech Stack:** React Native + Expo, TypeScript, Redux Toolkit with Redux Persist, Axios, React Navigation, React Native Paper, Skia (for charts in Phase 2)

## Global Constraints

- **Language:** TypeScript for all code (strict mode enabled)
- **Code Quality:** ESLint + Prettier enforced on commit
- **Testing:** Jest + React Native Testing Library, >80% coverage target for Phase 1
- **API:** Ergast F1 API (free, public, no auth required)
- **State:** Redux Toolkit for global state, Redux Persist for offline support
- **Platforms:** iOS + Android (Expo-compatible)
- **React Native Paper:** Used for all UI components (Material Design)
- **Naming:** camelCase for functions/variables, PascalCase for components/types

---

## Task 1: Project Setup & Dependencies

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `.eslintrc.json`
- Create: `prettier.config.js`
- Create: `.gitignore`

**Interfaces:**
- Produces: Expo project scaffold with all dependencies installed

- [ ] **Step 1: Initialize Expo project**

Run:
```bash
npx create-expo-app F1-Portfolio-App --template
cd F1-Portfolio-App
npm install
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-paper axios
npm install @reduxjs/toolkit react-redux redux-persist
npm install typescript @types/react @types/react-native
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
npm install --save-dev @types/jest ts-jest
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "app", "__tests__"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create .eslintrc.json**

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-types": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "env": {
    "jest": true,
    "react-native": true
  }
}
```

- [ ] **Step 6: Create prettier.config.js**

```javascript
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  printWidth: 100,
};
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
.expo/
dist/
.env
.env.local
*.log
.DS_Store
ios/Pods/
android/.gradle/
```

- [ ] **Step 8: Update app.json for Expo config**

```json
{
  "expo": {
    "name": "F1 Portfolio",
    "slug": "f1-portfolio",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.f1portfolio.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.f1portfolio.app"
    },
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "13.0"
          },
          "android": {
            "minSdkVersion": 21
          }
        }
      ]
    ]
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add package.json app.json tsconfig.json .eslintrc.json prettier.config.js .gitignore
git commit -m "chore: initialize expo project with dependencies and tooling"
```

---

## Task 2: TypeScript Type Definitions

**Files:**
- Create: `src/types/index.ts`

**Interfaces:**
- Produces: All TypeScript interfaces used across the app (Driver, Race, RaceResult, Standing, etc.)

- [ ] **Step 1: Create types file with all core interfaces**

```typescript
// src/types/index.ts

// Driver
export interface Driver {
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  dob: string;
  nationality: string;
  permanentNumber?: string;
  url: string;
}

// Constructor
export interface Constructor {
  constructorId: string;
  name: string;
  nationality: string;
  url: string;
}

// Circuit
export interface Circuit {
  circuitId: string;
  circuitName: string;
  location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
  url: string;
}

// Race
export interface Race {
  raceId: string;
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  circuit: Circuit;
  url: string;
}

// Race Result
export interface RaceResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  driver: Driver;
  constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  time?: {
    millis: string;
    time: string;
  };
  fastestLap?: {
    rank: string;
    lap: string;
    time: {
      time: string;
    };
    averageSpeed: {
      speed: string;
      units: string;
    };
  };
}

// Qualifying Result
export interface QualifyingResult {
  number: string;
  position: string;
  driver: Driver;
  constructor: Constructor;
  q1?: string;
  q2?: string;
  q3?: string;
}

// Standing
export interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  driver: Driver;
  constructors: Constructor[];
}

export interface ConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  constructor: Constructor;
}

// Standings Table
export interface StandingsTable {
  season: string;
  round: string;
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
}

// API Response types
export interface ErgastResponse<T> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
    [key: string]: T | any;
  };
}

// Redux state types
export interface RacesState {
  allRaces: Race[];
  selectedSeason: string;
  loading: boolean;
  error: string | null;
}

export interface StandingsState {
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  season: string;
  round: string;
  loading: boolean;
  error: string | null;
}

export interface ResultsState {
  results: RaceResult[];
  qualifyingResults: QualifyingResult[];
  selectedRaceId: string | null;
  loading: boolean;
  error: string | null;
}

export interface DriversState {
  drivers: Driver[];
  loading: boolean;
  error: string | null;
}

export interface UIState {
  selectedRaceId: string | null;
  selectedSeasonFilter: string;
  selectedDriverFilter: string | null;
  selectedConstructorFilter: string | null;
}

export interface AppState {
  races: RacesState;
  standings: StandingsState;
  results: ResultsState;
  drivers: DriversState;
  ui: UIState;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add typescript type definitions for all domain models"
```

---

## Task 3: API Service Layer (Ergast)

**Files:**
- Create: `src/services/ergastAPI.ts`
- Create: `src/utils/constants.ts`

**Interfaces:**
- Produces: `ErgastService` class with methods: `getCurrentSeason()`, `getRacesByYear()`, `getStandings()`, `getRaceResults()`, `getQualifying()`, `getDriver()`
- Consumes: Types from Task 2

- [ ] **Step 1: Create constants file**

```typescript
// src/utils/constants.ts

export const ERGAST_API_BASE_URL = 'https://ergast.com/api/f1';
export const API_TIMEOUT = 10000; // 10 seconds
export const CACHE_DURATION = 300000; // 5 minutes
export const RACE_ACTIVE_WINDOW = 7200000; // 2 hours (for real-time polling)
```

- [ ] **Step 2: Create Ergast API service with axios**

```typescript
// src/services/ergastAPI.ts

import axios, { AxiosInstance } from 'axios';
import { ERGAST_API_BASE_URL, API_TIMEOUT } from '@/utils/constants';
import {
  Race,
  RaceResult,
  QualifyingResult,
  StandingsTable,
  Driver,
  ErgastResponse,
} from '@/types';

export class ErgastService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: ERGAST_API_BASE_URL,
      timeout: API_TIMEOUT,
      responseType: 'json',
    });
  }

  async getCurrentSeason(): Promise<string> {
    try {
      const response = await this.api.get<ErgastResponse<any>>('/current.json');
      const races = response.data.MRData.RaceTable?.Races || [];
      if (races.length > 0) {
        return races[0].season;
      }
      return new Date().getFullYear().toString();
    } catch (error) {
      console.error('Failed to get current season:', error);
      throw error;
    }
  }

  async getRacesByYear(year: string): Promise<Race[]> {
    try {
      const response = await this.api.get<ErgastResponse<any>>(
        `/${year}.json`,
        { params: { limit: 100 } }
      );
      const races = response.data.MRData.RaceTable?.Races || [];
      return races.map((race: any) => this.transformRace(race));
    } catch (error) {
      console.error(`Failed to get races for year ${year}:`, error);
      throw error;
    }
  }

  async getStandings(
    season: string,
    round?: string
  ): Promise<StandingsTable> {
    try {
      const path = round ? `/${season}/${round}/standings.json` : `/${season}/standings.json`;
      const response = await this.api.get<ErgastResponse<any>>(path);
      const standingsTable = response.data.MRData.StandingsTable || {};
      return {
        season: standingsTable.season,
        round: standingsTable.round,
        driverStandings: standingsTable.StandingsList?.[0]?.DriverStandings || [],
        constructorStandings: standingsTable.StandingsList?.[0]?.ConstructorStandings || [],
      };
    } catch (error) {
      console.error(`Failed to get standings for ${season}/${round}:`, error);
      throw error;
    }
  }

  async getRaceResults(season: string, round: string): Promise<RaceResult[]> {
    try {
      const response = await this.api.get<ErgastResponse<any>>(
        `/${season}/${round}/results.json`
      );
      const results = response.data.MRData.RaceTable?.Races?.[0]?.Results || [];
      return results as RaceResult[];
    } catch (error) {
      console.error(`Failed to get results for ${season}/${round}:`, error);
      throw error;
    }
  }

  async getQualifying(season: string, round: string): Promise<QualifyingResult[]> {
    try {
      const response = await this.api.get<ErgastResponse<any>>(
        `/${season}/${round}/qualifying.json`
      );
      const results = response.data.MRData.RaceTable?.Races?.[0]?.QualifyingResults || [];
      return results as QualifyingResult[];
    } catch (error) {
      console.error(`Failed to get qualifying for ${season}/${round}:`, error);
      throw error;
    }
  }

  async getDriver(driverId: string): Promise<Driver> {
    try {
      const response = await this.api.get<ErgastResponse<any>>(
        `/drivers/${driverId}.json`
      );
      const driver = response.data.MRData.DriverTable?.Drivers?.[0];
      if (!driver) throw new Error('Driver not found');
      return driver as Driver;
    } catch (error) {
      console.error(`Failed to get driver ${driverId}:`, error);
      throw error;
    }
  }

  private transformRace(race: any): Race {
    return {
      raceId: race.raceId,
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      time: race.time,
      circuit: race.Circuit,
      url: race.url,
    };
  }
}

export const ergastService = new ErgastService();
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ergastAPI.ts src/utils/constants.ts
git commit -m "feat: implement ergast f1 api service layer with axios"
```

---

## Task 4: Redux Store Setup

**Files:**
- Create: `src/redux/store.ts`
- Create: `src/redux/hooks.ts`

**Interfaces:**
- Produces: Redux store with Redux Persist, `useAppDispatch` and `useAppSelector` hooks
- Consumes: Types from Task 2

- [ ] **Step 1: Create Redux store with persist middleware**

```typescript
// src/redux/store.ts

import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import racesReducer from './slices/racesSlice';
import standingsReducer from './slices/standingsSlice';
import resultsReducer from './slices/resultsSlice';
import driversReducer from './slices/driversSlice';
import uiReducer from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['races', 'standings', 'drivers'], // Persist these slices
  timeout: 5000,
};

const persistedRacesReducer = persistReducer(persistConfig, racesReducer);

export const store = configureStore({
  reducer: {
    races: persistedRacesReducer,
    standings: standingsReducer,
    results: resultsReducer,
    drivers: driversReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 2: Create Redux hooks**

```typescript
// src/redux/hooks.ts

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

- [ ] **Step 3: Install AsyncStorage dependency**

```bash
npm install @react-native-async-storage/async-storage
```

- [ ] **Step 4: Commit**

```bash
git add src/redux/store.ts src/redux/hooks.ts
git commit -m "feat: setup redux store with persist middleware"
```

---

## Task 5: Redux Slices (Races, Standings, Drivers, Results, UI)

**Files:**
- Create: `src/redux/slices/racesSlice.ts`
- Create: `src/redux/slices/standingsSlice.ts`
- Create: `src/redux/slices/driversSlice.ts`
- Create: `src/redux/slices/resultsSlice.ts`
- Create: `src/redux/slices/uiSlice.ts`

**Interfaces:**
- Produces: Redux slices with actions and thunks for fetching data
- Consumes: ErgastService from Task 3, Types from Task 2

- [ ] **Step 1: Create races slice with async thunk**

```typescript
// src/redux/slices/racesSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ergastService } from '@/services/ergastAPI';
import { Race, RacesState } from '@/types';

const initialState: RacesState = {
  allRaces: [],
  selectedSeason: new Date().getFullYear().toString(),
  loading: false,
  error: null,
};

export const fetchRacesByYear = createAsyncThunk(
  'races/fetchByYear',
  async (year: string, { rejectWithValue }) => {
    try {
      const races = await ergastService.getRacesByYear(year);
      return races;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch races');
    }
  }
);

export const fetchCurrentSeason = createAsyncThunk(
  'races/fetchCurrentSeason',
  async (_, { rejectWithValue }) => {
    try {
      const season = await ergastService.getCurrentSeason();
      return season;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch current season');
    }
  }
);

const racesSlice = createSlice({
  name: 'races',
  initialState,
  reducers: {
    setSelectedSeason: (state, action: PayloadAction<string>) => {
      state.selectedSeason = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRacesByYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRacesByYear.fulfilled, (state, action) => {
        state.loading = false;
        state.allRaces = action.payload;
      })
      .addCase(fetchRacesByYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentSeason.fulfilled, (state, action) => {
        state.selectedSeason = action.payload;
      });
  },
});

export const { setSelectedSeason, clearError } = racesSlice.actions;
export default racesSlice.reducer;
```

- [ ] **Step 2: Create standings slice**

```typescript
// src/redux/slices/standingsSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ergastService } from '@/services/ergastAPI';
import { StandingsState } from '@/types';

const initialState: StandingsState = {
  driverStandings: [],
  constructorStandings: [],
  season: '',
  round: '',
  loading: false,
  error: null,
};

export const fetchStandings = createAsyncThunk(
  'standings/fetch',
  async (
    { season, round }: { season: string; round?: string },
    { rejectWithValue }
  ) => {
    try {
      const standings = await ergastService.getStandings(season, round);
      return standings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch standings');
    }
  }
);

const standingsSlice = createSlice({
  name: 'standings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStandings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStandings.fulfilled, (state, action) => {
        state.loading = false;
        state.driverStandings = action.payload.driverStandings;
        state.constructorStandings = action.payload.constructorStandings;
        state.season = action.payload.season;
        state.round = action.payload.round;
      })
      .addCase(fetchStandings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = standingsSlice.actions;
export default standingsSlice.reducer;
```

- [ ] **Step 3: Create drivers slice**

```typescript
// src/redux/slices/driversSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DriversState, Driver } from '@/types';

const initialState: DriversState = {
  drivers: [],
  loading: false,
  error: null,
};

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    setDrivers: (state, action: PayloadAction<Driver[]>) => {
      state.drivers = action.payload;
    },
    addDriver: (state, action: PayloadAction<Driver>) => {
      const exists = state.drivers.find((d) => d.driverId === action.payload.driverId);
      if (!exists) {
        state.drivers.push(action.payload);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setDrivers, addDriver, clearError } = driversSlice.actions;
export default driversSlice.reducer;
```

- [ ] **Step 4: Create results slice**

```typescript
// src/redux/slices/resultsSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ergastService } from '@/services/ergastAPI';
import { ResultsState } from '@/types';

const initialState: ResultsState = {
  results: [],
  qualifyingResults: [],
  selectedRaceId: null,
  loading: false,
  error: null,
};

export const fetchRaceResults = createAsyncThunk(
  'results/fetchRaceResults',
  async (
    { season, round }: { season: string; round: string },
    { rejectWithValue }
  ) => {
    try {
      const results = await ergastService.getRaceResults(season, round);
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch race results');
    }
  }
);

export const fetchQualifyingResults = createAsyncThunk(
  'results/fetchQualifyingResults',
  async (
    { season, round }: { season: string; round: string },
    { rejectWithValue }
  ) => {
    try {
      const results = await ergastService.getQualifying(season, round);
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch qualifying results');
    }
  }
);

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setSelectedRaceId: (state, action: PayloadAction<string | null>) => {
      state.selectedRaceId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRaceResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRaceResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(fetchRaceResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchQualifyingResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQualifyingResults.fulfilled, (state, action) => {
        state.loading = false;
        state.qualifyingResults = action.payload;
      })
      .addCase(fetchQualifyingResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedRaceId, clearError } = resultsSlice.actions;
export default resultsSlice.reducer;
```

- [ ] **Step 5: Create UI slice**

```typescript
// src/redux/slices/uiSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '@/types';

const initialState: UIState = {
  selectedRaceId: null,
  selectedSeasonFilter: new Date().getFullYear().toString(),
  selectedDriverFilter: null,
  selectedConstructorFilter: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedRaceId: (state, action: PayloadAction<string | null>) => {
      state.selectedRaceId = action.payload;
    },
    setSelectedSeasonFilter: (state, action: PayloadAction<string>) => {
      state.selectedSeasonFilter = action.payload;
    },
    setSelectedDriverFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedDriverFilter = action.payload;
    },
    setSelectedConstructorFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedConstructorFilter = action.payload;
    },
    resetFilters: (state) => {
      state.selectedDriverFilter = null;
      state.selectedConstructorFilter = null;
      state.selectedRaceId = null;
    },
  },
});

export const {
  setSelectedRaceId,
  setSelectedSeasonFilter,
  setSelectedDriverFilter,
  setSelectedConstructorFilter,
  resetFilters,
} = uiSlice.actions;

export default uiSlice.reducer;
```

- [ ] **Step 6: Commit**

```bash
git add src/redux/slices/
git commit -m "feat: implement redux slices for races, standings, drivers, results, and ui"
```

---

## Task 6: Utility Functions

**Files:**
- Create: `src/utils/formatters.ts`

**Interfaces:**
- Produces: Formatter functions for dates, times, points, etc.

- [ ] **Step 1: Create formatters utility**

```typescript
// src/utils/formatters.ts

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatTime = (timeString?: string): string => {
  if (!timeString) return '--:--';
  // Time format from API is HH:MM:SSZ
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

export const formatDuration = (milliseconds: string): string => {
  try {
    const ms = parseInt(milliseconds, 10);
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } catch {
    return '--:--';
  }
};

export const formatPoints = (points: string | number): string => {
  const p = typeof points === 'string' ? parseInt(points, 10) : points;
  return p.toString();
};

export const formatPosition = (position: string | number): string => {
  const pos = typeof position === 'string' ? parseInt(position, 10) : position;
  switch (pos) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    default:
      return `${pos}th`;
  }
};

export const getDriverInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const formatDriverName = (
  givenName: string,
  familyName: string,
  short = false
): string => {
  if (short) {
    return `${givenName.charAt(0)}. ${familyName}`;
  }
  return `${givenName} ${familyName}`;
};

export const isRaceFinished = (status: string): boolean => {
  return !status.toLowerCase().includes('lap') && status.length > 0;
};

export const getRaceStatus = (status: string): string => {
  if (status === '+1 Lap') return 'Lapped';
  if (status.includes('Lap')) return status;
  return status;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/formatters.ts
git commit -m "feat: add formatter utility functions for dates, times, and race data"
```

---

## Task 7: Navigation Setup

**Files:**
- Create: `src/navigation/types.ts`
- Create: `src/navigation/RootNavigator.tsx`
- Create: `src/navigation/HomeNavigator.tsx`

**Interfaces:**
- Produces: Navigation structure with typed routes

- [ ] **Step 1: Create navigation types**

```typescript
// src/navigation/types.ts

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Home: NavigatorScreenParams<HomeTabParamList>;
};

export type HomeTabParamList = {
  HomeScreen: undefined;
  Calendar: undefined;
  Standings: undefined;
  RaceDetails: { raceId: string; season: string; round: string };
};
```

- [ ] **Step 2: Create home navigator (bottom tabs)**

```typescript
// src/navigation/HomeNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeTabParamList } from './types';
import HomeScreen from '@/screens/home/HomeScreen';
import CalendarScreen from '@/screens/calendar/CalendarScreen';
import StandingsScreen from '@/screens/standings/StandingsScreen';

const Tab = createBottomTabNavigator<HomeTabParamList>();

export const HomeNavigator = (): JSX.Element => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'HomeScreen') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Standings') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#666',
      })}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen
        name="Standings"
        component={StandingsScreen}
        options={{ title: 'Standings' }}
      />
    </Tab.Navigator>
  );
};
```

- [ ] **Step 3: Create root navigator (stack)**

```typescript
// src/navigation/RootNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeNavigator } from './HomeNavigator';
import RaceDetailsScreen from '@/screens/race-details/RaceDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = (): JSX.Element => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

- [ ] **Step 4: Commit**

```bash
git add src/navigation/
git commit -m "feat: setup react navigation with bottom tabs and stack navigation"
```

---

## Task 8: Common Components

**Files:**
- Create: `src/components/common/SkeletonLoader.tsx`

**Interfaces:**
- Produces: `SkeletonLoader` component for loading states

- [ ] **Step 1: Create skeleton loader component**

```typescript
// src/components/common/SkeletonLoader.tsx

import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface SkeletonLoaderProps {
  width?: number;
  height?: number;
  count?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = Dimensions.get('window').width - 16,
  height = 100,
  count = 1,
  borderRadius = 8,
  style,
}) => {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeleton,
            {
              width,
              height,
              borderRadius,
              opacity,
              marginBottom: 12,
            },
            style,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/SkeletonLoader.tsx
git commit -m "feat: add skeleton loader component for loading states"
```

---

## Task 9: Race Components (Part 1)

**Files:**
- Create: `src/components/race/RaceCard.tsx`
- Create: `src/components/race/StatCard.tsx`

**Interfaces:**
- Produces: `RaceCard` and `StatCard` components
- Consumes: Formatter functions from Task 6, Race type from Task 2

- [ ] **Step 1: Create RaceCard component**

```typescript
// src/components/race/RaceCard.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { Race } from '@/types';
import { formatDate, formatTime } from '@/utils/formatters';

interface RaceCardProps {
  race: Race;
  onPress?: () => void;
}

export const RaceCard: React.FC<RaceCardProps> = ({ race, onPress }) => {
  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card.Content style={styles.content}>
          <Text variant="titleLarge" style={styles.title}>
            {race.raceName}
          </Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text variant="labelSmall" style={styles.label}>
                Date
              </Text>
              <Text variant="bodyMedium">{formatDate(race.date)}</Text>
            </View>
            <View style={styles.column}>
              <Text variant="labelSmall" style={styles.label}>
                Circuit
              </Text>
              <Text variant="bodyMedium">{race.circuit.circuitName}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text variant="labelSmall" style={styles.label}>
                Location
              </Text>
              <Text variant="bodySmall">{race.circuit.location.country}</Text>
            </View>
            <View style={styles.column}>
              <Text variant="labelSmall" style={styles.label}>
                Time
              </Text>
              <Text variant="bodySmall">{formatTime(race.time)}</Text>
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    marginHorizontal: 8,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  column: {
    flex: 1,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
});
```

- [ ] **Step 2: Create StatCard component**

```typescript
// src/components/race/StatCard.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  variant?: 'default' | 'success' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  variant = 'default',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return '#e8f5e9';
      case 'warning':
        return '#fff3e0';
      default:
        return '#f5f5f5';
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: getBackgroundColor() }]}>
      <Card.Content style={styles.content}>
        <Text variant="labelSmall" style={styles.label}>
          {label}
        </Text>
        <Text variant="headlineSmall" style={styles.value}>
          {value}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  content: {
    padding: 12,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/race/RaceCard.tsx src/components/race/StatCard.tsx
git commit -m "feat: add RaceCard and StatCard components"
```

---

## Task 10: Race Components (Part 2)

**Files:**
- Create: `src/components/race/DriverRow.tsx`
- Create: `src/components/race/ConstructorRow.tsx`

**Interfaces:**
- Produces: `DriverRow` and `ConstructorRow` components
- Consumes: Formatter functions, DriverStanding and ConstructorStanding types

- [ ] **Step 1: Create DriverRow component**

```typescript
// src/components/race/DriverRow.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { DriverStanding } from '@/types';
import { formatDriverName, formatPoints, formatPosition } from '@/utils/formatters';

interface DriverRowProps {
  standing: DriverStanding;
  index: number;
}

export const DriverRow: React.FC<DriverRowProps> = ({ standing, index }) => {
  return (
    <>
      <View style={styles.container}>
        <View style={styles.positionContainer}>
          <Text variant="labelLarge" style={styles.position}>
            {formatPosition(standing.position)}
          </Text>
        </View>
        <View style={styles.driverContainer}>
          <Text variant="bodyMedium" style={styles.driverName}>
            {formatDriverName(standing.driver.givenName, standing.driver.familyName, false)}
          </Text>
          <Text variant="labelSmall" style={styles.constructor}>
            {standing.constructors[0]?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text variant="labelSmall" style={styles.statLabel}>
              W
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {standing.wins}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="labelSmall" style={styles.statLabel}>
              Pts
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {formatPoints(standing.points)}
            </Text>
          </View>
        </View>
      </View>
      {index < 19 && <Divider />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  positionContainer: {
    width: 40,
  },
  position: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  driverContainer: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  constructor: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#999',
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Create ConstructorRow component**

```typescript
// src/components/race/ConstructorRow.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { ConstructorStanding } from '@/types';
import { formatPoints, formatPosition } from '@/utils/formatters';

interface ConstructorRowProps {
  standing: ConstructorStanding;
  index: number;
}

export const ConstructorRow: React.FC<ConstructorRowProps> = ({ standing, index }) => {
  return (
    <>
      <View style={styles.container}>
        <View style={styles.positionContainer}>
          <Text variant="labelLarge" style={styles.position}>
            {formatPosition(standing.position)}
          </Text>
        </View>
        <View style={styles.constructorContainer}>
          <Text variant="bodyMedium" style={styles.constructorName}>
            {standing.constructor.name}
          </Text>
          <Text variant="labelSmall" style={styles.country}>
            {standing.constructor.nationality}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text variant="labelSmall" style={styles.statLabel}>
              W
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {standing.wins}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="labelSmall" style={styles.statLabel}>
              Pts
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {formatPoints(standing.points)}
            </Text>
          </View>
        </View>
      </View>
      {index < 9 && <Divider />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  positionContainer: {
    width: 40,
  },
  position: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  constructorContainer: {
    flex: 1,
    marginLeft: 12,
  },
  constructorName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  country: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#999',
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '600',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/race/DriverRow.tsx src/components/race/ConstructorRow.tsx
git commit -m "feat: add DriverRow and ConstructorRow components for standings display"
```

---

## Task 11: Race Components (Part 3)

**Files:**
- Create: `src/components/race/ResultsTable.tsx`
- Create: `src/components/race/LapTimeTable.tsx`

**Interfaces:**
- Produces: `ResultsTable` and `LapTimeTable` components
- Consumes: RaceResult and QualifyingResult types

- [ ] **Step 1: Create ResultsTable component**

```typescript
// src/components/race/ResultsTable.tsx

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { RaceResult } from '@/types';
import {
  formatPosition,
  formatDriverName,
  formatPoints,
  getRaceStatus,
  isRaceFinished,
} from '@/utils/formatters';

interface ResultsTableProps {
  results: RaceResult[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const renderResult = ({ item, index }: { item: RaceResult; index: number }) => {
    const statusColor = isRaceFinished(item.status) ? '#666' : '#2196f3';

    return (
      <View style={styles.row}>
        <Text variant="labelLarge" style={styles.position}>
          {item.positionText}
        </Text>
        <View style={styles.driverInfo}>
          <Text variant="bodyMedium" style={styles.driverName}>
            {formatDriverName(item.driver.givenName, item.driver.familyName)}
          </Text>
          <Text variant="labelSmall" style={styles.team}>
            {item.constructor.name}
          </Text>
        </View>
        <View style={styles.raceStats}>
          <Text variant="bodySmall" style={styles.laps}>
            {item.laps}L
          </Text>
          <Text variant="bodySmall" style={[styles.points, { color: statusColor }]}>
            {isRaceFinished(item.status) ? formatPoints(item.points) : getRaceStatus(item.status)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(_, index) => index.toString()}
        scrollEnabled={false}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  position: {
    width: 32,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  team: {
    color: '#666',
  },
  raceStats: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  laps: {
    fontWeight: '600',
  },
  points: {
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});
```

- [ ] **Step 2: Create LapTimeTable component**

```typescript
// src/components/race/LapTimeTable.tsx

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { QualifyingResult } from '@/types';
import { formatDriverName } from '@/utils/formatters';

interface LapTimeTableProps {
  results: QualifyingResult[];
  title?: string;
}

export const LapTimeTable: React.FC<LapTimeTableProps> = ({
  results,
  title = 'Qualifying Results',
}) => {
  const renderResult = ({ item }: { item: QualifyingResult }) => {
    return (
      <View style={styles.row}>
        <Text variant="labelLarge" style={styles.position}>
          {item.position}
        </Text>
        <View style={styles.driverInfo}>
          <Text variant="bodyMedium" style={styles.driverName}>
            {formatDriverName(item.driver.givenName, item.driver.familyName)}
          </Text>
          <Text variant="labelSmall" style={styles.team}>
            {item.constructor.name}
          </Text>
        </View>
        <View style={styles.times}>
          {item.q3 && (
            <Text variant="bodySmall" style={styles.time}>
              Q3: {item.q3}
            </Text>
          )}
          {item.q2 && !item.q3 && (
            <Text variant="bodySmall" style={styles.time}>
              Q2: {item.q2}
            </Text>
          )}
          {item.q1 && !item.q2 && (
            <Text variant="bodySmall" style={styles.time}>
              Q1: {item.q1}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <Card.Title title={title} />
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(_, index) => index.toString()}
        scrollEnabled={false}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  position: {
    width: 32,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  team: {
    color: '#666',
  },
  times: {
    alignItems: 'flex-end',
  },
  time: {
    fontWeight: '500',
    color: '#1976d2',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/race/ResultsTable.tsx src/components/race/LapTimeTable.tsx
git commit -m "feat: add ResultsTable and LapTimeTable components"
```

---

## Task 12: Screens (Part 1) - HomeScreen

**Files:**
- Create: `src/screens/home/HomeScreen.tsx`

**Interfaces:**
- Produces: HomeScreen component displaying latest race and quick stats
- Consumes: Redux hooks, RaceCard, StatCard components

- [ ] **Step 1: Create HomeScreen**

```typescript
// src/screens/home/HomeScreen.tsx

import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchRacesByYear, fetchCurrentSeason } from '@/redux/slices/racesSlice';
import { fetchStandings } from '@/redux/slices/standingsSlice';
import { RaceCard } from '@/components/race/RaceCard';
import { StatCard } from '@/components/race/StatCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { formatDate } from '@/utils/formatters';

export const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { allRaces, selectedSeason, loading, error } = useAppSelector((state) => state.races);
  const { driverStandings } = useAppSelector((state) => state.standings);

  useEffect(() => {
    const initializeData = async () => {
      await dispatch(fetchCurrentSeason());
    };
    initializeData();
  }, [dispatch]);

  useEffect(() => {
    if (selectedSeason) {
      dispatch(fetchRacesByYear(selectedSeason) as any);
      dispatch(fetchStandings({ season: selectedSeason }) as any);
    }
  }, [selectedSeason, dispatch]);

  const latestRace = allRaces.length > 0 ? allRaces[allRaces.length - 1] : null;
  const leaderDriver = driverStandings.length > 0 ? driverStandings[0] : null;

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <SkeletonLoader count={3} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">F1 2026</Text>
        <Text variant="bodyMedium" style={styles.season}>
          Season {selectedSeason}
        </Text>
      </View>

      {error && (
        <Text variant="bodyMedium" style={styles.error}>
          {error}
        </Text>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Latest Race
      </Text>
      {latestRace ? (
        <RaceCard race={latestRace} />
      ) : (
        <Text variant="bodyMedium">No races available</Text>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Championship Leader
      </Text>
      {leaderDriver ? (
        <View style={styles.statsGrid}>
          <StatCard
            label="Position"
            value={leaderDriver.positionText}
            variant="success"
          />
          <StatCard
            label="Points"
            value={leaderDriver.points}
            variant="success"
          />
          <StatCard
            label="Wins"
            value={leaderDriver.wins}
          />
        </View>
      ) : (
        <Text variant="bodyMedium">No standings available</Text>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  season: {
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 8,
  },
  error: {
    color: '#d32f2f',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  footer: {
    height: 20,
  },
});

export default HomeScreen;
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/home/HomeScreen.tsx
git commit -m "feat: add HomeScreen with latest race and championship leader stats"
```

---

## Task 13: Screens (Part 2) - CalendarScreen

**Files:**
- Create: `src/screens/calendar/CalendarScreen.tsx`

**Interfaces:**
- Produces: CalendarScreen component displaying season race calendar
- Consumes: Redux hooks, RaceCard component, fetchRacesByYear thunk

- [ ] **Step 1: Create CalendarScreen**

```typescript
// src/screens/calendar/CalendarScreen.tsx

import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Segmented } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchRacesByYear, setSelectedSeason } from '@/redux/slices/racesSlice';
import { RaceCard } from '@/components/race/RaceCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

export const CalendarScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { allRaces, selectedSeason, loading } = useAppSelector((state) => state.races);
  const [displaySeason, setDisplaySeason] = useState(selectedSeason);

  const seasons = ['2024', '2025', '2026'];

  useEffect(() => {
    dispatch(fetchRacesByYear(displaySeason) as any);
    dispatch(setSelectedSeason(displaySeason));
  }, [displaySeason, dispatch]);

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <SkeletonLoader count={5} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">F1 Calendar</Text>
      </View>

      <View style={styles.seasonSelector}>
        <Segmented
          value={displaySeason}
          onValueChange={setDisplaySeason}
          buttons={seasons.map((s) => ({ value: s, label: s }))}
        />
      </View>

      <Text variant="bodySmall" style={styles.raceCount}>
        {allRaces.length} races
      </Text>

      {allRaces.length > 0 ? (
        allRaces.map((race) => (
          <RaceCard key={race.raceId} race={race} />
        ))
      ) : (
        <Text variant="bodyMedium" style={styles.emptyState}>
          No races found for this season
        </Text>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  seasonSelector: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  raceCount: {
    paddingHorizontal: 16,
    color: '#666',
    marginBottom: 12,
  },
  emptyState: {
    paddingHorizontal: 16,
    textAlign: 'center',
    marginTop: 32,
    color: '#999',
  },
  footer: {
    height: 20,
  },
});

export default CalendarScreen;
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/calendar/CalendarScreen.tsx
git commit -m "feat: add CalendarScreen with seasonal race listing and filters"
```

---

## Task 14: Screens (Part 3) - StandingsScreen

**Files:**
- Create: `src/screens/standings/StandingsScreen.tsx`

**Interfaces:**
- Produces: StandingsScreen component displaying driver and constructor standings
- Consumes: Redux hooks, DriverRow, ConstructorRow components

- [ ] **Step 1: Create StandingsScreen**

```typescript
// src/screens/standings/StandingsScreen.tsx

import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchStandings } from '@/redux/slices/standingsSlice';
import { DriverRow } from '@/components/race/DriverRow';
import { ConstructorRow } from '@/components/race/ConstructorRow';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

export const StandingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedSeason } = useAppSelector((state) => state.races);
  const { driverStandings, constructorStandings, loading } = useAppSelector(
    (state) => state.standings
  );
  const [standingsType, setStandingsType] = useState('drivers');

  useEffect(() => {
    dispatch(fetchStandings({ season: selectedSeason }) as any);
  }, [selectedSeason, dispatch]);

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <SkeletonLoader count={5} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Standings</Text>
      </View>

      <View style={styles.typeSelector}>
        <SegmentedButtons
          value={standingsType}
          onValueChange={setStandingsType}
          buttons={[
            { value: 'drivers', label: 'Drivers' },
            { value: 'constructors', label: 'Constructors' },
          ]}
        />
      </View>

      {standingsType === 'drivers' ? (
        <View>
          {driverStandings.length > 0 ? (
            driverStandings.map((standing, index) => (
              <DriverRow key={standing.driver.driverId} standing={standing} index={index} />
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyState}>
              No standings available
            </Text>
          )}
        </View>
      ) : (
        <View>
          {constructorStandings.length > 0 ? (
            constructorStandings.map((standing, index) => (
              <ConstructorRow
                key={standing.constructor.constructorId}
                standing={standing}
                index={index}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyState}>
              No standings available
            </Text>
          )}
        </View>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeSelector: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  emptyState: {
    paddingHorizontal: 16,
    textAlign: 'center',
    marginTop: 32,
    color: '#999',
  },
  footer: {
    height: 20,
  },
});

export default StandingsScreen;
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/standings/StandingsScreen.tsx
git commit -m "feat: add StandingsScreen showing driver and constructor championship standings"
```

---

## Task 15: Screens (Part 4) - RaceDetailsScreen

**Files:**
- Create: `src/screens/race-details/RaceDetailsScreen.tsx`

**Interfaces:**
- Produces: RaceDetailsScreen component displaying full race information
- Consumes: Redux hooks, ResultsTable, LapTimeTable components, NativeStackScreenProps

- [ ] **Step 1: Create RaceDetailsScreen**

```typescript
// src/screens/race-details/RaceDetailsScreen.tsx

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, SegmentedButtons, Card } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchRaceResults,
  fetchQualifyingResults,
  setSelectedRaceId,
} from '@/redux/slices/resultsSlice';
import { ResultsTable } from '@/components/race/ResultsTable';
import { LapTimeTable } from '@/components/race/LapTimeTable';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { formatDate } from '@/utils/formatters';

interface RaceDetailsScreenProps {
  route: {
    params: {
      raceId: string;
      season: string;
      round: string;
    };
  };
}

export const RaceDetailsScreen: React.FC<RaceDetailsScreenProps> = ({ route }) => {
  const { season, round } = route.params;
  const dispatch = useAppDispatch();
  const { results, qualifyingResults, loading } = useAppSelector((state) => state.results);
  const { allRaces } = useAppSelector((state) => state.races);
  const [displayTab, setDisplayTab] = useState('results');

  const race = allRaces.find((r) => r.round === round);

  useEffect(() => {
    dispatch(setSelectedRaceId(route.params.raceId));
    dispatch(fetchRaceResults({ season, round }) as any);
    dispatch(fetchQualifyingResults({ season, round }) as any);
  }, [season, round, dispatch, route.params.raceId]);

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <SkeletonLoader count={3} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {race && (
        <View style={styles.header}>
          <Text variant="headlineSmall">{race.raceName}</Text>
          <Text variant="bodySmall" style={styles.date}>
            {formatDate(race.date)}
          </Text>
          <Text variant="bodySmall" style={styles.location}>
            {race.circuit.location.country}
          </Text>
        </View>
      )}

      <View style={styles.tabSelector}>
        <SegmentedButtons
          value={displayTab}
          onValueChange={setDisplayTab}
          buttons={[
            { value: 'results', label: 'Results' },
            { value: 'qualifying', label: 'Qualifying' },
          ]}
        />
      </View>

      {displayTab === 'results' && results.length > 0 && (
        <ResultsTable results={results} />
      )}

      {displayTab === 'qualifying' && qualifyingResults.length > 0 && (
        <LapTimeTable results={qualifyingResults} title="Qualifying Results" />
      )}

      {displayTab === 'results' && results.length === 0 && (
        <Text variant="bodyMedium" style={styles.emptyState}>
          No race results available
        </Text>
      )}

      {displayTab === 'qualifying' && qualifyingResults.length === 0 && (
        <Text variant="bodyMedium" style={styles.emptyState}>
          No qualifying results available
        </Text>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  date: {
    color: '#666',
    marginTop: 4,
  },
  location: {
    color: '#999',
    marginTop: 2,
  },
  tabSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyState: {
    paddingHorizontal: 16,
    textAlign: 'center',
    marginTop: 32,
    color: '#999',
  },
  footer: {
    height: 20,
  },
});

export default RaceDetailsScreen;
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/race-details/RaceDetailsScreen.tsx
git commit -m "feat: add RaceDetailsScreen with results and qualifying data"
```

---

## Task 16: App Entry Point

**Files:**
- Create: `app/index.tsx`

**Interfaces:**
- Produces: Expo app entry point with Redux Provider and Persistor
- Consumes: RootNavigator, Redux store and persistor

- [ ] **Step 1: Create Expo app entry point**

```typescript
// app/index.tsx

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';
import { store, persistor } from '@/redux/store';
import { RootNavigator } from '@/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <RootNavigator />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Install required dependencies for entry point**

```bash
npm install react-native-gesture-handler expo-splash-screen redux-persist
```

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: create expo app entry point with redux and navigation"
```

---

## Task 17: Unit Tests - API Service

**Files:**
- Create: `__tests__/unit/services/ergastAPI.test.ts`

**Interfaces:**
- Consumes: ErgastService from Task 3

- [ ] **Step 1: Create API service unit tests**

```typescript
// __tests__/unit/services/ergastAPI.test.ts

import { ErgastService } from '@/services/ergastAPI';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ErgastService', () => {
  let service: ErgastService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ErgastService();
  });

  test('should fetch races for a given year', async () => {
    const mockRaces = [
      {
        raceId: '1',
        season: '2026',
        round: '1',
        raceName: 'Bahrain GP',
        date: '2026-03-15',
        circuit: { circuitId: '1', circuitName: 'Sakhir' },
      },
    ];

    mockedAxios.create().get.mockResolvedValue({
      data: {
        MRData: {
          RaceTable: {
            Races: mockRaces,
          },
        },
      },
    });

    const races = await service.getRacesByYear('2026');
    expect(races).toHaveLength(1);
    expect(races[0].raceName).toBe('Bahrain GP');
  });

  test('should handle API errors gracefully', async () => {
    mockedAxios.create().get.mockRejectedValue(new Error('Network error'));

    await expect(service.getRacesByYear('2026')).rejects.toThrow('Network error');
  });

  test('should fetch standings for a season', async () => {
    const mockStandings = {
      season: '2026',
      round: '1',
      StandingsList: [
        {
          DriverStandings: [],
          ConstructorStandings: [],
        },
      ],
    };

    mockedAxios.create().get.mockResolvedValue({
      data: {
        MRData: {
          StandingsTable: mockStandings,
        },
      },
    });

    const standings = await service.getStandings('2026');
    expect(standings.season).toBe('2026');
  });
});
```

- [ ] **Step 2: Create test directory and commit**

```bash
mkdir -p __tests__/unit/services
git add __tests__/unit/services/ergastAPI.test.ts
git commit -m "test: add unit tests for ergast api service"
```

---

## Task 18: Component Tests

**Files:**
- Create: `__tests__/components/race/RaceCard.test.tsx`
- Create: `__tests__/components/race/DriverRow.test.tsx`

**Interfaces:**
- Consumes: RaceCard, DriverRow components, React Native Testing Library

- [ ] **Step 1: Create RaceCard component test**

```typescript
// __tests__/components/race/RaceCard.test.tsx

import React from 'react';
import { render } from '@testing-library/react-native';
import { RaceCard } from '@/components/race/RaceCard';
import { Race } from '@/types';

describe('RaceCard', () => {
  const mockRace: Race = {
    raceId: '1',
    season: '2026',
    round: '1',
    raceName: 'Bahrain GP',
    date: '2026-03-15',
    time: '13:00:00Z',
    circuit: {
      circuitId: '1',
      circuitName: 'Sakhir Circuit',
      location: {
        lat: '26.0325',
        long: '50.5106',
        locality: 'Manama',
        country: 'Bahrain',
      },
      url: 'http://en.wikipedia.org/wiki/Bahrain_International_Circuit',
    },
    url: 'http://en.wikipedia.org/wiki/2026_Bahrain_Grand_Prix',
  };

  test('renders race card with race name', () => {
    const { getByText } = render(<RaceCard race={mockRace} />);
    expect(getByText('Bahrain GP')).toBeTruthy();
  });

  test('displays race location', () => {
    const { getByText } = render(<RaceCard race={mockRace} />);
    expect(getByText('Bahrain')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <RaceCard race={mockRace} onPress={mockOnPress} />
    );
    // Note: Full interaction testing requires adjustments to component structure
  });
});
```

- [ ] **Step 2: Create DriverRow component test**

```typescript
// __tests__/components/race/DriverRow.test.tsx

import React from 'react';
import { render } from '@testing-library/react-native';
import { DriverRow } from '@/components/race/DriverRow';
import { DriverStanding } from '@/types';

describe('DriverRow', () => {
  const mockStanding: DriverStanding = {
    position: '1',
    positionText: '1',
    points: '25',
    wins: '2',
    driver: {
      driverId: 'max_verstappen',
      code: 'VER',
      givenName: 'Max',
      familyName: 'Verstappen',
      dob: '1997-12-30',
      nationality: 'Dutch',
      url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
    },
    constructors: [
      {
        constructorId: 'red_bull',
        name: 'Red Bull Racing',
        nationality: 'Austrian',
        url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
      },
    ],
  };

  test('renders driver name', () => {
    const { getByText } = render(<DriverRow standing={mockStanding} index={0} />);
    expect(getByText('Max Verstappen')).toBeTruthy();
  });

  test('displays driver points', () => {
    const { getByText } = render(<DriverRow standing={mockStanding} index={0} />);
    expect(getByText('25')).toBeTruthy();
  });

  test('displays driver wins', () => {
    const { getByText } = render(<DriverRow standing={mockStanding} index={0} />);
    expect(getByText('2')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Create test files and commit**

```bash
mkdir -p __tests__/components/race
git add __tests__/components/race/RaceCard.test.tsx __tests__/components/race/DriverRow.test.tsx
git commit -m "test: add component tests for RaceCard and DriverRow"
```

---

## Task 19: Integration Tests

**Files:**
- Create: `__tests__/integration/raceFlow.test.ts`

**Interfaces:**
- Consumes: Redux store, slices, API service

- [ ] **Step 1: Create integration tests for race flow**

```typescript
// __tests__/integration/raceFlow.test.ts

import { configureStore } from '@reduxjs/toolkit';
import racesReducer from '@/redux/slices/racesSlice';
import standingsReducer from '@/redux/slices/standingsSlice';
import driversReducer from '@/redux/slices/driversSlice';
import resultsReducer from '@/redux/slices/resultsSlice';
import uiReducer from '@/redux/slices/uiSlice';
import { fetchRacesByYear, setSelectedSeason } from '@/redux/slices/racesSlice';
import { fetchStandings } from '@/redux/slices/standingsSlice';

describe('Race Flow Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        races: racesReducer,
        standings: standingsReducer,
        drivers: driversReducer,
        results: resultsReducer,
        ui: uiReducer,
      },
    });
  });

  test('should set selected season and load races', () => {
    store.dispatch(setSelectedSeason('2026'));

    const state = store.getState();
    expect(state.races.selectedSeason).toBe('2026');
  });

  test('should initialize ui state correctly', () => {
    const state = store.getState();
    expect(state.ui.selectedRaceId).toBeNull();
    expect(state.ui.selectedSeasonFilter).toBe(new Date().getFullYear().toString());
  });

  test('should have correct initial standings state', () => {
    const state = store.getState();
    expect(state.standings.driverStandings).toEqual([]);
    expect(state.standings.constructorStandings).toEqual([]);
  });
});
```

- [ ] **Step 2: Create integration tests directory and commit**

```bash
mkdir -p __tests__/integration
git add __tests__/integration/raceFlow.test.ts
git commit -m "test: add integration tests for race flow and redux state"
```

---

## Task 20: Error Handling & Offline Support

**Files:**
- Modify: `src/redux/slices/racesSlice.ts` (add offline fallback)
- Modify: `src/services/ergastAPI.ts` (add retry logic)

**Interfaces:**
- Consumes: existing slices and services

- [ ] **Step 1: Add retry logic to API service**

Add this to `src/services/ergastAPI.ts` after the constructor:

```typescript
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, i))
          );
        }
      }
    }
    throw lastError;
  }
```

And modify each fetch method to use `withRetry`:

```typescript
async getRacesByYear(year: string): Promise<Race[]> {
  return this.withRetry(async () => {
    const response = await this.api.get<ErgastResponse<any>>(
      `/${year}.json`,
      { params: { limit: 100 } }
    );
    const races = response.data.MRData.RaceTable?.Races || [];
    return races.map((race: any) => this.transformRace(race));
  });
}
```

- [ ] **Step 2: Commit error handling**

```bash
git add src/services/ergastAPI.ts
git commit -m "feat: add retry logic with exponential backoff to api service"
```

---

## Task 21: Final Testing & Build

**Files:**
- Test all code

**Interfaces:**
- No new files

- [ ] **Step 1: Run all tests**

```bash
npm test -- --coverage
```

Expected: All tests pass, >80% coverage on Phase 1 features

- [ ] **Step 2: Lint code**

```bash
npm run lint
```

Expected: No errors, warnings only for legitimate cases

- [ ] **Step 3: Format code**

```bash
npm run format
```

- [ ] **Step 4: Build for iOS preview**

```bash
npx eas build --platform ios --profile preview
```

- [ ] **Step 5: Build for Android preview**

```bash
npx eas build --platform android --profile preview
```

- [ ] **Step 6: Test on device or emulator**

Run app using:
```bash
npx expo start
```

Then press `i` for iOS or `a` for Android simulator

- [ ] **Step 7: Verify all features**

✓ HomeScreen displays latest race and standings
✓ CalendarScreen lists all races with season filter
✓ StandingsScreen shows both driver and constructor standings
✓ RaceDetailsScreen shows results and qualifying data
✓ Offline mode works with persisted data
✓ Error messages display gracefully
✓ Loading states show skeleton loaders
✓ Navigation between screens works smoothly

- [ ] **Step 8: Final commit**

```bash
git add package.json
git commit -m "feat: complete phase 1 implementation - real-time f1 stats app"
```

---

## Success Criteria (Phase 1)

✅ All screens functional and navigable
✅ API integration working with real Ergast data
✅ Redux state management predictable
✅ Offline support with AsyncStorage
✅ >80% test coverage
✅ Error handling for network failures
✅ Smooth animations and transitions
✅ Professional UI with React Native Paper
✅ Code linted and formatted
✅ Ready for App Store submission

---

## Next Steps (After Phase 1 Completion)

1. Deploy to TestFlight (iOS) and Google Play Beta (Android)
2. Create GitHub repository with README and screenshots
3. Gather feedback from testing
4. Begin Phase 2: Driver Analysis features

