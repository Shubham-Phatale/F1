import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthStatus, UserProfile } from '@/types';

// Initial state
const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'idle';
    },
    setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.status = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'error';
      }
    },
    clearAuth: state => {
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const { setUser, setAuthStatus, setAuthError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
