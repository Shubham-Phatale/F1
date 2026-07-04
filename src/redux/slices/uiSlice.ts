import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '@/types';

// Initial state
const initialState: UIState = {
  selectedRaceId: null,
  selectedSeasonFilter: '',
  selectedDriverFilter: null,
  selectedConstructorFilter: null,
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedRaceId: (state, action: PayloadAction<string | null>) => {
      state.selectedRaceId = action.payload;
    },
    setSelectedSeasonFilter: (state, action: PayloadAction<string>) => {
      state.selectedSeasonFilter = action.payload;
    },
    setSelectedDriverFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedDriverFilter = action.payload;
    },
    setSelectedConstructorFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedConstructorFilter = action.payload;
    },
    resetFilters: (state) => {
      state.selectedRaceId = null;
      state.selectedSeasonFilter = '';
      state.selectedDriverFilter = null;
      state.selectedConstructorFilter = null;
    },
  },
});

export const {
  setSelectedRaceId,
  setSelectedSeasonFilter,
  setSelectedDriverFilter,
  setSelectedConstructorFilter,
  resetFilters,
} = uiSlice.actions;
export default uiSlice.reducer;
