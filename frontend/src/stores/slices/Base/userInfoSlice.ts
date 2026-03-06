import { createSlice } from "@reduxjs/toolkit";

export interface UserInfoInterface {
  name: string
  id: string
  email: string
}

export const userInfoSlice = createSlice({
  name: "userInfoSlice",
  initialState: {
    value: null as UserInfoInterface | null,
  },
  reducers: {
    SetUserInfoSlice: (
      state,
      action: {
        payload: UserInfoInterface | null;
      }
    ) => {
      state.value = action.payload;
    },
  },
});

export const { SetUserInfoSlice } = userInfoSlice.actions;

export const userInfoSliceReducer = userInfoSlice.reducer;
