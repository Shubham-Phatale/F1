import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RacesState, Race } from '@/types';
import { ergastService } from '@/services/ergastAPI';

// Async thunks
export const fetchRacesByYear = createAsyncThunk<Race[], string, { rejectValue: string }>(
  'races/fetchByYear',
  async (year, { rejectWithValue }) => {
    try {
      const races = await ergastService.getRacesByYear(year);
      return races;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch races';
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentSeason = createAsyncThunk<string, void, { rejectValue: string }>(
  'races/fetchCurrentSeason',
  async (_, { rejectWithValue }) => {
    try {
      const season = await ergastService.getCurrentSeason();
      return season;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch current season';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState: RacesState = {
  allRaces: [],
  selectedSeason: '',
  loading: false,
  error: null,
};

// Slice
const racesSlice = createSlice({
  name: 'races',
  initialState,
  reducers: {
    setSelectedSeason: (state, action: PayloadAction<string>) => {
      state.selectedSeason = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // fetchRacesByYear
    builder.addCase(fetchRacesByYear.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRacesByYear.fulfilled, (state, action) => {
      state.loading = false;
      state.allRaces = action.payload;
    });
    builder.addCase(fetchRacesByYear.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });

    // fetchCurrentSeason
    builder.addCase(fetchCurrentSeason.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentSeason.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedSeason = action.payload;
    });
    builder.addCase(fetchCurrentSeason.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });
  },
});

export const { setSelectedSeason, clearError } = racesSlice.actions;
export default racesSlice.reducer;
