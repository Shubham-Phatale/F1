import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RacesState, StandingsState, ResultsState, DriversState, UIState } from '../types';

// Temporary placeholder reducers (will be replaced with actual slices in Task 5)
const racesReducer = (state: RacesState = {
  allRaces: [],
  selectedSeason: '',
  loading: false,
  error: null,
}): RacesState => state;

const standingsReducer = (state: StandingsState = {
  driverStandings: [],
  constructorStandings: [],
  season: '',
  round: '',
  loading: false,
  error: null,
}): StandingsState => state;

const resultsReducer = (state: ResultsState = {
  results: [],
  qualifyingResults: [],
  selectedRaceId: null,
  loading: false,
  error: null,
}): ResultsState => state;

const driversReducer = (state: DriversState = {
  drivers: [],
  loading: false,
  error: null,
}): DriversState => state;

const uiReducer = (state: UIState = {
  selectedRaceId: null,
  selectedSeasonFilter: '',
  selectedDriverFilter: null,
  selectedConstructorFilter: null,
}): UIState => state;

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['races', 'standings', 'drivers'],
};

// Create root reducer
const rootReducer = (state: any, action: any) => ({
  races: racesReducer(state?.races, action),
  standings: standingsReducer(state?.standings, action),
  results: resultsReducer(state?.results, action),
  drivers: driversReducer(state?.drivers, action),
  ui: uiReducer(state?.ui, action),
});

// Apply persist to root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with Redux Persist
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
