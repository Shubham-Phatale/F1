import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AnalyticsState,
  DriverStats,
  SeasonPerformance,
  TrendData,
  HeadToHeadComparison,
  ConstructorStats,
} from '@/types';

// Initial state
const initialState: AnalyticsState = {
  driverStats: [],
  seasonPerformances: [],
  trends: [],
  headToHeadComparisons: [],
  constructorStats: [],
  selectedDriverId: null,
  selectedSeasonFilter: '',
  loading: false,
  error: null,
};

// Slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setDriverStats: (state, action: PayloadAction<DriverStats[]>) => {
      state.driverStats = action.payload;
    },
    setSeasonPerformances: (state, action: PayloadAction<SeasonPerformance[]>) => {
      state.seasonPerformances = action.payload;
    },
    setTrends: (state, action: PayloadAction<TrendData[]>) => {
      state.trends = action.payload;
    },
    setHeadToHeadComparisons: (state, action: PayloadAction<HeadToHeadComparison[]>) => {
      state.headToHeadComparisons = action.payload;
    },
    setConstructorStats: (state, action: PayloadAction<ConstructorStats[]>) => {
      state.constructorStats = action.payload;
    },
    setSelectedDriverId: (state, action: PayloadAction<string | null>) => {
      state.selectedDriverId = action.payload;
    },
    setSelectedSeasonFilter: (state, action: PayloadAction<string>) => {
      state.selectedSeasonFilter = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAnalytics: state => {
      state.driverStats = [];
      state.seasonPerformances = [];
      state.trends = [];
      state.headToHeadComparisons = [];
      state.constructorStats = [];
      state.selectedDriverId = null;
      state.selectedSeasonFilter = '';
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setDriverStats,
  setSeasonPerformances,
  setTrends,
  setHeadToHeadComparisons,
  setConstructorStats,
  setSelectedDriverId,
  setSelectedSeasonFilter,
  setLoading,
  setError,
  clearAnalytics,
} = analyticsSlice.actions;
export default analyticsSlice.reducer;
