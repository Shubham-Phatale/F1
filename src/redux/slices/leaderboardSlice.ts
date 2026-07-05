import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LeaderboardEntry, Prediction } from '@/types';

export interface LeaderboardState {
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
