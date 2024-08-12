import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  authenticated: false,
  userData: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.authenticated = true;
      state.userData = action.payload;
    },
    logout: (state) => {
      state.authenticated = false;
      state.userData = null;
    },
    currentUser: (state, action) => {
      if (action.payload) {
        state.authenticated = true;
        state.userData = action.payload;
      }
    },
  },
});

export const { login, logout, currentUser } = authSlice.actions;
export default authSlice.reducer;
