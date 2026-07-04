import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UsersState, UserProfile } from '@/types';

// Initial state
const initialState: UsersState = {
  byId: {},
  loading: false,
  error: null,
};

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.byId[action.payload.uid] = action.payload;
    },
    setUsersLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUsersError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearUsers: state => {
      state.byId = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setUserProfile, setUsersLoading, setUsersError, clearUsers } = usersSlice.actions;
export default usersSlice.reducer;
