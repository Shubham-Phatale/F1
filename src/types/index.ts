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
  // Optional race identity, attached when results are aggregated across a whole
  // season (e.g. getSeasonResults). Single-race fetches (getRaceResults) leave
  // these undefined.
  season?: string;
  round?: string;
  raceName?: string;
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

// Analytics Data Types - Phase 2
// Driver performance metrics
export interface DriverStats {
  driverId: string;
  driver: Driver;
  totalRaces: number;
  totalPoints: number;
  totalWins: number;
  podiums: number;
  polePositions: number;
  fastestLaps: number;
  averageFinish: number;
  bestFinish: number;
  worstFinish: number;
  championships: number;
}

// Single season breakdown
export interface SeasonPerformance {
  season: string;
  driverId: string;
  raceCount: number;
  pointsEarned: number;
  wins: number;
  podiums: number;
  polePositions: number;
  fastestLaps: number;
  averageFinish: number;
  finalChampionshipPosition: number;
  constructor: Constructor;
}

// Historical trends across seasons
export interface TrendData {
  driverId: string;
  metricType: 'points' | 'wins' | 'podiums' | 'poles' | 'fastestLaps';
  seasons: string[];
  values: number[];
  trend: 'improving' | 'declining' | 'stable';
}

// Driver vs driver comparison stats
export interface HeadToHeadComparison {
  driver1Id: string;
  driver2Id: string;
  driver1: Driver;
  driver2: Driver;
  racesMet: number;
  driver1Wins: number;
  driver2Wins: number;
  draws: number;
  driver1PolePositions: number;
  driver2PolePositions: number;
  driver1FastestLaps: number;
  driver2FastestLaps: number;
  competitionYears: string[];
}

// Constructor/Team performance metrics
export interface ConstructorStats {
  constructorId: string;
  constructor: Constructor;
  totalRaces: number;
  totalPoints: number;
  totalWins: number;
  podiums: number;
  polePositions: number;
  fastestLaps: number;
  championships: number;
  driverCount: number;
  averageDriverRating: number;
}

// Auth & User types - Phase 3A
// Firestore-backed user profile document. Stored in the `users` collection with
// the auth `uid` as the document id.
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  favoriteDriverId?: string;
  favoriteConstructorId?: string;
  joinedAt: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthState {
  user: UserProfile | null;
  status: AuthStatus;
  error: string | null;
}

export interface UsersState {
  byId: Record<string, UserProfile>;
  loading: boolean;
  error: string | null;
}

// Redux state for analytics
export interface AnalyticsState {
  driverStats: DriverStats[];
  seasonPerformances: SeasonPerformance[];
  trends: TrendData[];
  headToHeadComparisons: HeadToHeadComparison[];
  constructorStats: ConstructorStats[];
  selectedDriverId: string | null;
  selectedSeasonFilter: string;
  loading: boolean;
  error: string | null;
}

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
