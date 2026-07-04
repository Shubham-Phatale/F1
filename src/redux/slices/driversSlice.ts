import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DriversState, Driver } from '@/types';

// Initial state
const initialState: DriversState = {
  drivers: [],
  loading: false,
  error: null,
};

// Slice
const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    setDrivers: (state, action: PayloadAction<Driver[]>) => {
      state.drivers = action.payload;
    },
    addDriver: (state, action: PayloadAction<Driver>) => {
      const exists = state.drivers.some((d) => d.driverId === action.payload.driverId);
      if (!exists) {
        state.drivers.push(action.payload);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setDrivers, addDriver, clearError } = driversSlice.actions;
export default driversSlice.reducer;
