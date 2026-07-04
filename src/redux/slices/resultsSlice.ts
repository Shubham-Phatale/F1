import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ResultsState, RaceResult, QualifyingResult } from '@/types';
import { ergastService } from '@/services/ergastAPI';

// Async thunks
export const fetchRaceResults = createAsyncThunk<
  RaceResult[],
  { season: string; round: string },
  { rejectValue: string }
>('results/fetchRaceResults', async ({ season, round }, { rejectWithValue }) => {
  try {
    const results = await ergastService.getRaceResults(season, round);
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch race results';
    return rejectWithValue(message);
  }
});

export const fetchQualifyingResults = createAsyncThunk<
  QualifyingResult[],
  { season: string; round: string },
  { rejectValue: string }
>('results/fetchQualifyingResults', async ({ season, round }, { rejectWithValue }) => {
  try {
    const results = await ergastService.getQualifying(season, round);
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch qualifying results';
    return rejectWithValue(message);
  }
});

// Initial state
const initialState: ResultsState = {
  results: [],
  qualifyingResults: [],
  selectedRaceId: null,
  loading: false,
  error: null,
};

// Slice
const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setSelectedRaceId: (state, action: PayloadAction<string | null>) => {
      state.selectedRaceId = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // fetchRaceResults
    builder.addCase(fetchRaceResults.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRaceResults.fulfilled, (state, action) => {
      state.loading = false;
      state.results = action.payload;
    });
    builder.addCase(fetchRaceResults.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });

    // fetchQualifyingResults
    builder.addCase(fetchQualifyingResults.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQualifyingResults.fulfilled, (state, action) => {
      state.loading = false;
      state.qualifyingResults = action.payload;
    });
    builder.addCase(fetchQualifyingResults.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });
  },
});

export const { setSelectedRaceId, clearError } = resultsSlice.actions;
export default resultsSlice.reducer;
