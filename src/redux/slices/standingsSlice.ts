import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { StandingsState, StandingsTable } from '@/types';
import { ergastService } from '@/services/ergastAPI';

// Async thunk
export const fetchStandings = createAsyncThunk<
  StandingsTable,
  { season: string; round?: string },
  { rejectValue: string }
>(
  'standings/fetch',
  async ({ season, round }, { rejectWithValue }) => {
    try {
      const standings = await ergastService.getStandings(season, round);
      return standings;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch standings';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState: StandingsState = {
  driverStandings: [],
  constructorStandings: [],
  season: '',
  round: '',
  loading: false,
  error: null,
};

// Slice
const standingsSlice = createSlice({
  name: 'standings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStandings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStandings.fulfilled, (state, action) => {
      state.loading = false;
      state.driverStandings = action.payload.driverStandings;
      state.constructorStandings = action.payload.constructorStandings;
      state.season = action.payload.season;
      state.round = action.payload.round;
    });
    builder.addCase(fetchStandings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });
  },
});

export const { clearError } = standingsSlice.actions;
export default standingsSlice.reducer;
