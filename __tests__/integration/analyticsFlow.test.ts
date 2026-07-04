import { configureStore } from '@reduxjs/toolkit';
import racesReducer from '@/redux/slices/racesSlice';
import standingsReducer from '@/redux/slices/standingsSlice';
import driversReducer from '@/redux/slices/driversSlice';
import resultsReducer from '@/redux/slices/resultsSlice';
import uiReducer from '@/redux/slices/uiSlice';
import analyticsReducer, {
  setDriverStats,
  setHeadToHeadComparisons,
  setConstructorStats,
  setTrends,
  setSelectedDriverId,
  setSelectedSeasonFilter,
  setLoading,
  setError,
  clearAnalytics,
} from '@/redux/slices/analyticsSlice';
import { RootState } from '@/redux/store';
import {
  Driver,
  Constructor,
  DriverStats,
  HeadToHeadComparison,
  ConstructorStats,
  TrendData,
} from '@/types';

// Mock builders
const mockDriver: Driver = {
  driverId: 'max_verstappen',
  code: 'VER',
  givenName: 'Max',
  familyName: 'Verstappen',
  dob: '1997-12-30',
  nationality: 'Dutch',
  permanentNumber: '1',
  url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
};

const mockDriver2: Driver = {
  driverId: 'lewis_hamilton',
  code: 'HAM',
  givenName: 'Lewis',
  familyName: 'Hamilton',
  dob: '1985-01-07',
  nationality: 'British',
  permanentNumber: '44',
  url: 'http://en.wikipedia.org/wiki/Lewis_Hamilton',
};

const mockConstructor: Constructor = {
  constructorId: 'red_bull',
  name: 'Red Bull Racing',
  nationality: 'Austrian',
  url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
};

const mockDriverStats: DriverStats = {
  driverId: 'max_verstappen',
  driver: mockDriver,
  totalRaces: 10,
  totalPoints: 250,
  totalWins: 5,
  podiums: 8,
  polePositions: 4,
  fastestLaps: 3,
  averageFinish: 2.1,
  bestFinish: 1,
  worstFinish: 6,
  championships: 1,
};

const mockComparison: HeadToHeadComparison = {
  driver1Id: 'max_verstappen',
  driver2Id: 'lewis_hamilton',
  driver1: mockDriver,
  driver2: mockDriver2,
  racesMet: 10,
  driver1Wins: 6,
  driver2Wins: 4,
  draws: 0,
  driver1PolePositions: 4,
  driver2PolePositions: 3,
  driver1FastestLaps: 3,
  driver2FastestLaps: 2,
  competitionYears: ['2021'],
};

const mockConstructorStats: ConstructorStats = {
  constructorId: 'red_bull',
  constructor: mockConstructor,
  totalRaces: 20,
  totalPoints: 500,
  totalWins: 10,
  podiums: 15,
  polePositions: 8,
  fastestLaps: 6,
  championships: 1,
  driverCount: 2,
  averageDriverRating: 85.5,
};

const mockTrend: TrendData = {
  driverId: 'max_verstappen',
  metricType: 'points',
  seasons: ['2023', '2024'],
  values: [575, 437],
  trend: 'declining',
};

const buildStore = () =>
  configureStore({
    reducer: {
      races: racesReducer,
      standings: standingsReducer,
      drivers: driversReducer,
      results: resultsReducer,
      ui: uiReducer,
      analytics: analyticsReducer,
    },
  });

describe('Analytics Flow Integration', () => {
  let store: ReturnType<typeof buildStore>;

  beforeEach(() => {
    store = buildStore();
  });

  describe('Analytics State Initialization', () => {
    it('should initialize analytics state with correct defaults', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.driverStats).toEqual([]);
      expect(state.analytics.seasonPerformances).toEqual([]);
      expect(state.analytics.trends).toEqual([]);
      expect(state.analytics.headToHeadComparisons).toEqual([]);
      expect(state.analytics.constructorStats).toEqual([]);
      expect(state.analytics.selectedDriverId).toBeNull();
      expect(state.analytics.selectedSeasonFilter).toBe('');
      expect(state.analytics.loading).toBe(false);
      expect(state.analytics.error).toBeNull();
    });

    it('should have the analytics reducer registered in the store', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(state).toHaveProperty('analytics');
    });
  });

  describe('Driver Stats Actions', () => {
    it('should set driver stats', () => {
      // Act
      store.dispatch(setDriverStats([mockDriverStats]));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.driverStats).toHaveLength(1);
      expect(state.analytics.driverStats[0].driverId).toBe('max_verstappen');
      expect(state.analytics.driverStats[0].totalWins).toBe(5);
    });
  });

  describe('Head-to-Head Actions', () => {
    it('should set head-to-head comparisons', () => {
      // Act
      store.dispatch(setHeadToHeadComparisons([mockComparison]));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.headToHeadComparisons).toHaveLength(1);
      expect(state.analytics.headToHeadComparisons[0].driver1Id).toBe('max_verstappen');
      expect(state.analytics.headToHeadComparisons[0].driver2Id).toBe('lewis_hamilton');
      expect(state.analytics.headToHeadComparisons[0].driver1Wins).toBe(6);
    });
  });

  describe('Constructor Stats Actions', () => {
    it('should set constructor stats', () => {
      // Act
      store.dispatch(setConstructorStats([mockConstructorStats]));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.constructorStats).toHaveLength(1);
      expect(state.analytics.constructorStats[0].constructorId).toBe('red_bull');
      expect(state.analytics.constructorStats[0].driverCount).toBe(2);
    });
  });

  describe('Trends Actions', () => {
    it('should set trends', () => {
      // Act
      store.dispatch(setTrends([mockTrend]));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.trends).toHaveLength(1);
      expect(state.analytics.trends[0].metricType).toBe('points');
      expect(state.analytics.trends[0].trend).toBe('declining');
    });
  });

  describe('Selection and Filter Actions', () => {
    it('should set selected driver id', () => {
      // Act
      store.dispatch(setSelectedDriverId('max_verstappen'));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.selectedDriverId).toBe('max_verstappen');
    });

    it('should clear selected driver id', () => {
      // Act
      store.dispatch(setSelectedDriverId('max_verstappen'));
      store.dispatch(setSelectedDriverId(null));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.selectedDriverId).toBeNull();
    });

    it('should set the selected season filter', () => {
      // Act
      store.dispatch(setSelectedSeasonFilter('2024'));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.selectedSeasonFilter).toBe('2024');
    });
  });

  describe('Loading and Error Actions', () => {
    it('should set loading state', () => {
      // Act
      store.dispatch(setLoading(true));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.loading).toBe(true);
    });

    it('should set error state', () => {
      // Act
      store.dispatch(setError('Failed to load analytics'));
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.error).toBe('Failed to load analytics');
    });
  });

  describe('Clear Analytics Action', () => {
    it('should reset all analytics state back to defaults', () => {
      // Arrange - populate state first
      store.dispatch(setDriverStats([mockDriverStats]));
      store.dispatch(setHeadToHeadComparisons([mockComparison]));
      store.dispatch(setConstructorStats([mockConstructorStats]));
      store.dispatch(setTrends([mockTrend]));
      store.dispatch(setSelectedDriverId('max_verstappen'));
      store.dispatch(setSelectedSeasonFilter('2024'));
      store.dispatch(setLoading(true));
      store.dispatch(setError('some error'));

      // Act
      store.dispatch(clearAnalytics());
      const state = store.getState() as RootState;

      // Assert
      expect(state.analytics.driverStats).toEqual([]);
      expect(state.analytics.seasonPerformances).toEqual([]);
      expect(state.analytics.trends).toEqual([]);
      expect(state.analytics.headToHeadComparisons).toEqual([]);
      expect(state.analytics.constructorStats).toEqual([]);
      expect(state.analytics.selectedDriverId).toBeNull();
      expect(state.analytics.selectedSeasonFilter).toBe('');
      expect(state.analytics.loading).toBe(false);
      expect(state.analytics.error).toBeNull();
    });
  });

  describe('Cross-Reducer Independence', () => {
    it('should not affect other reducers when analytics actions dispatch', () => {
      // Act
      store.dispatch(setSelectedDriverId('max_verstappen'));
      const state = store.getState() as RootState;

      // Assert - other slices remain at defaults
      expect(state.analytics.selectedDriverId).toBe('max_verstappen');
      expect(state.drivers.drivers).toEqual([]);
      expect(state.results.results).toEqual([]);
      expect(state.standings.driverStandings).toEqual([]);
    });
  });
});
