import { createSlice } from "@reduxjs/toolkit";

const checkAuth:boolean | null = null;

export const authCheckSlice = createSlice({
  name: "authCheckSlice",
  initialState: {
    value: checkAuth as boolean | null,
  },
  reducers: {
    SetAuthCheckSlice: (
      state,
      action: {
        payload: boolean;
      }
    ) => {
      state.value = action.payload;
    },
  },
});

export const { SetAuthCheckSlice } = authCheckSlice.actions;

export const authCheckSliceReducer = authCheckSlice.reducer;
