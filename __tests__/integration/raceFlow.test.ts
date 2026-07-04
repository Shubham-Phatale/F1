import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import racesReducer, { setSelectedSeason } from '@/redux/slices/racesSlice';
import standingsReducer from '@/redux/slices/standingsSlice';
import driversReducer, { addDriver } from '@/redux/slices/driversSlice';
import resultsReducer from '@/redux/slices/resultsSlice';
import uiReducer, { setSelectedRaceId, setSelectedSeasonFilter } from '@/redux/slices/uiSlice';
import { RootState } from '@/redux/store';

describe('Race Flow Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Create a fresh store for each test
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

  describe('Season Selection Flow', () => {
    it('should set selected season and verify state update', () => {
      // Arrange
      const testSeason = '2026';

      // Act
      store.dispatch(setSelectedSeason(testSeason));
      const state = store.getState() as RootState;

      // Assert
      expect(state.races.selectedSeason).toBe('2026');
      expect(state.races.loading).toBe(false);
      expect(state.races.error).toBeNull();
    });

    it('should update season multiple times', () => {
      // Arrange
      const firstSeason = '2025';
      const secondSeason = '2026';

      // Act
      store.dispatch(setSelectedSeason(firstSeason));
      const stateAfterFirst = store.getState() as RootState;
      expect(stateAfterFirst.races.selectedSeason).toBe('2025');

      store.dispatch(setSelectedSeason(secondSeason));
      const stateAfterSecond = store.getState() as RootState;

      // Assert
      expect(stateAfterSecond.races.selectedSeason).toBe('2026');
    });
  });

  describe('UI State Initialization', () => {
    it('should initialize ui state with correct defaults', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(state.ui.selectedRaceId).toBeNull();
      expect(state.ui.selectedSeasonFilter).toBe('');
      expect(state.ui.selectedDriverFilter).toBeNull();
      expect(state.ui.selectedConstructorFilter).toBeNull();
    });

    it('should set selected race id in UI state', () => {
      // Arrange
      const raceId = 'race_123';

      // Act
      store.dispatch(setSelectedRaceId(raceId));
      const state = store.getState() as RootState;

      // Assert
      expect(state.ui.selectedRaceId).toBe(raceId);
    });

    it('should clear selected race id', () => {
      // Arrange
      const raceId = 'race_123';

      // Act
      store.dispatch(setSelectedRaceId(raceId));
      const stateWithRace = store.getState() as RootState;
      expect(stateWithRace.ui.selectedRaceId).toBe(raceId);

      store.dispatch(setSelectedRaceId(null));
      const stateAfterClear = store.getState() as RootState;

      // Assert
      expect(stateAfterClear.ui.selectedRaceId).toBeNull();
    });

    it('should set selected season filter', () => {
      // Arrange
      const currentYear = new Date().getFullYear().toString();

      // Act
      store.dispatch(setSelectedSeasonFilter(currentYear));
      const state = store.getState() as RootState;

      // Assert
      expect(state.ui.selectedSeasonFilter).toBe(currentYear);
    });
  });

  describe('Standings State Initialization', () => {
    it('should have correct initial standings state', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(state.standings.driverStandings).toEqual([]);
      expect(state.standings.constructorStandings).toEqual([]);
      expect(state.standings.season).toBe('');
      expect(state.standings.round).toBe('');
      expect(state.standings.loading).toBe(false);
      expect(state.standings.error).toBeNull();
    });

    it('should maintain empty standings state until fetched', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(Array.isArray(state.standings.driverStandings)).toBe(true);
      expect(Array.isArray(state.standings.constructorStandings)).toBe(true);
      expect(state.standings.driverStandings.length).toBe(0);
      expect(state.standings.constructorStandings.length).toBe(0);
    });
  });

  describe('Drivers State Management', () => {
    it('should initialize drivers state correctly', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(state.drivers.drivers).toEqual([]);
      expect(state.drivers.loading).toBe(false);
      expect(state.drivers.error).toBeNull();
    });

    it('should add driver to drivers state', () => {
      // Arrange
      const mockDriver = {
        driverId: 'max_verstappen',
        code: 'VER',
        givenName: 'Max',
        familyName: 'Verstappen',
        dob: '1997-12-30',
        nationality: 'Dutch',
        permanentNumber: '1',
        url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
      };

      // Act
      store.dispatch(addDriver(mockDriver));
      const state = store.getState() as RootState;

      // Assert
      expect(state.drivers.drivers).toHaveLength(1);
      expect(state.drivers.drivers[0].driverId).toBe('max_verstappen');
      expect(state.drivers.drivers[0].familyName).toBe('Verstappen');
    });

    it('should not add duplicate drivers', () => {
      // Arrange
      const mockDriver = {
        driverId: 'max_verstappen',
        code: 'VER',
        givenName: 'Max',
        familyName: 'Verstappen',
        dob: '1997-12-30',
        nationality: 'Dutch',
        permanentNumber: '1',
        url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
      };

      // Act
      store.dispatch(addDriver(mockDriver));
      store.dispatch(addDriver(mockDriver));
      const state = store.getState() as RootState;

      // Assert
      expect(state.drivers.drivers).toHaveLength(1);
    });

    it('should add multiple different drivers', () => {
      // Arrange
      const driver1 = {
        driverId: 'max_verstappen',
        code: 'VER',
        givenName: 'Max',
        familyName: 'Verstappen',
        dob: '1997-12-30',
        nationality: 'Dutch',
        permanentNumber: '1',
        url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
      };

      const driver2 = {
        driverId: 'lewis_hamilton',
        code: 'HAM',
        givenName: 'Lewis',
        familyName: 'Hamilton',
        dob: '1985-01-07',
        nationality: 'British',
        permanentNumber: '44',
        url: 'http://en.wikipedia.org/wiki/Lewis_Hamilton',
      };

      // Act
      store.dispatch(addDriver(driver1));
      store.dispatch(addDriver(driver2));
      const state = store.getState() as RootState;

      // Assert
      expect(state.drivers.drivers).toHaveLength(2);
      expect(state.drivers.drivers[0].familyName).toBe('Verstappen');
      expect(state.drivers.drivers[1].familyName).toBe('Hamilton');
    });
  });

  describe('Results State Initialization', () => {
    it('should initialize results state correctly', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(state.results.results).toEqual([]);
      expect(state.results.qualifyingResults).toEqual([]);
      expect(state.results.selectedRaceId).toBeNull();
      expect(state.results.loading).toBe(false);
      expect(state.results.error).toBeNull();
    });

    it('should maintain empty arrays for race and qualifying results', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(Array.isArray(state.results.results)).toBe(true);
      expect(Array.isArray(state.results.qualifyingResults)).toBe(true);
      expect(state.results.results.length).toBe(0);
      expect(state.results.qualifyingResults.length).toBe(0);
    });
  });

  describe('Cross-Reducer State Flow', () => {
    it('should handle season selection and UI filter update together', () => {
      // Arrange
      const season = '2026';
      const currentYear = new Date().getFullYear().toString();

      // Act
      store.dispatch(setSelectedSeason(season));
      store.dispatch(setSelectedSeasonFilter(currentYear));
      const state = store.getState() as RootState;

      // Assert
      expect(state.races.selectedSeason).toBe(season);
      expect(state.ui.selectedSeasonFilter).toBe(currentYear);
    });

    it('should maintain independent state across reducers', () => {
      // Arrange
      const season = '2026';
      const raceId = 'race_123';
      const mockDriver = {
        driverId: 'max_verstappen',
        code: 'VER',
        givenName: 'Max',
        familyName: 'Verstappen',
        dob: '1997-12-30',
        nationality: 'Dutch',
        permanentNumber: '1',
        url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
      };

      // Act
      store.dispatch(setSelectedSeason(season));
      store.dispatch(setSelectedRaceId(raceId));
      store.dispatch(addDriver(mockDriver));
      const state = store.getState() as RootState;

      // Assert - verify each reducer's state independently
      expect(state.races.selectedSeason).toBe(season);
      expect(state.ui.selectedRaceId).toBe(raceId);
      expect(state.drivers.drivers).toHaveLength(1);
      expect(state.standings.driverStandings.length).toBe(0); // unchanged
      expect(state.results.results.length).toBe(0); // unchanged
    });

    it('should reset race selection without affecting other states', () => {
      // Arrange
      const season = '2026';
      const raceId = 'race_123';
      const mockDriver = {
        driverId: 'max_verstappen',
        code: 'VER',
        givenName: 'Max',
        familyName: 'Verstappen',
        dob: '1997-12-30',
        nationality: 'Dutch',
        permanentNumber: '1',
        url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
      };

      // Act - setup initial state
      store.dispatch(setSelectedSeason(season));
      store.dispatch(setSelectedRaceId(raceId));
      store.dispatch(addDriver(mockDriver));

      // Act - clear race selection
      store.dispatch(setSelectedRaceId(null));
      const state = store.getState() as RootState;

      // Assert
      expect(state.ui.selectedRaceId).toBeNull();
      expect(state.races.selectedSeason).toBe(season); // unchanged
      expect(state.drivers.drivers).toHaveLength(1); // unchanged
    });
  });

  describe('Store Configuration', () => {
    it('should have all reducers configured', () => {
      // Act
      const state = store.getState() as RootState;

      // Assert
      expect(state).toHaveProperty('races');
      expect(state).toHaveProperty('standings');
      expect(state).toHaveProperty('drivers');
      expect(state).toHaveProperty('results');
      expect(state).toHaveProperty('ui');
    });

    it('should maintain consistent state structure across operations', () => {
      // Act
      store.dispatch(setSelectedSeason('2026'));
      const state1 = store.getState() as RootState;

      store.dispatch(setSelectedRaceId('race_123'));
      const state2 = store.getState() as RootState;

      // Assert - structure should not change
      expect(Object.keys(state1)).toEqual(Object.keys(state2));
    });

    it('should provide separate store instances for each test', () => {
      // Act
      const store1 = configureStore({
        reducer: {
          races: racesReducer,
          standings: standingsReducer,
          drivers: driversReducer,
          results: resultsReducer,
          ui: uiReducer,
        },
      });

      store.dispatch(setSelectedSeason('2026'));
      const stateFromTestStore = store.getState() as RootState;
      const stateFromNewStore = store1.getState() as RootState;

      // Assert - each store should be independent
      expect(stateFromTestStore.races.selectedSeason).toBe('2026');
      expect(stateFromNewStore.races.selectedSeason).toBe('');
    });
  });
});
