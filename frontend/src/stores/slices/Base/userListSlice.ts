import { createSlice } from "@reduxjs/toolkit";

export interface UserListInterface {
  id: string;
  email: string;
  name: string;
  created_at: string;
  password: string;
  role: number;
}

export const userListSlice = createSlice({
  name: "userListSlice",
  initialState: {
    value: null as UserListInterface[] | null,
  },
  reducers: {
    SetUserListSlice: (
      state,
      action: {
        payload: UserListInterface[] | null;
      },
    ) => {
      state.value = action.payload;
    },
  },
});

export const { SetUserListSlice } = userListSlice.actions;

export const userListSliceReducer = userListSlice.reducer;
