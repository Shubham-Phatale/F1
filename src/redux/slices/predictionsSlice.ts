import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Prediction } from '@/types';

export interface PredictionsState {
  byRound: Record<string, Prediction>;
  loading: boolean;
  error: string | null;
}

const initialState: PredictionsState = { byRound: {}, loading: false, error: null };

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState,
  reducers: {
    setPredictions: (state, action: PayloadAction<Prediction[]>) => {
      state.byRound = {};
      for (const p of action.payload) state.byRound[p.round] = p;
    },
    setPrediction: (state, action: PayloadAction<Prediction>) => {
      state.byRound[action.payload.round] = action.payload;
    },
    setPredictionsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setPredictionsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearPredictions: (state) => {
      state.byRound = {};
      state.error = null;
    },
  },
});

export const {
  setPredictions,
  setPrediction,
  setPredictionsLoading,
  setPredictionsError,
  clearPredictions,
} = predictionsSlice.actions;
export default predictionsSlice.reducer;
