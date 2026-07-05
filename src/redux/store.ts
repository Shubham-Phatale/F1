import { configureStore, combineReducers } from '@reduxjs/toolkit';
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
import driversReducer from './slices/driversSlice';
import resultsReducer from './slices/resultsSlice';
import uiReducer from './slices/uiSlice';
import analyticsReducer from './slices/analyticsSlice';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import predictionsReducer from './slices/predictionsSlice';
import leaderboardReducer from './slices/leaderboardSlice';

// Redux Persist configuration.
// `version` is bumped whenever the persisted data shape changes so stale cached
// state (e.g. pre-normalization API data) is discarded instead of rehydrated.
const persistConfig = {
  key: 'root-v2',
  version: 2,
  storage: AsyncStorage,
  whitelist: ['races', 'standings', 'drivers'],
};

// Create root reducer using combineReducers
const rootReducer = combineReducers({
  races: racesReducer,
  standings: standingsReducer,
  results: resultsReducer,
  drivers: driversReducer,
  ui: uiReducer,
  analytics: analyticsReducer,
  auth: authReducer,
  users: usersReducer,
  predictions: predictionsReducer,
  leaderboard: leaderboardReducer,
});

// Apply persist to root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with Redux Persist
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
