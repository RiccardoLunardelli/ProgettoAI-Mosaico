import { createSlice } from "@reduxjs/toolkit";


export const configListSlice = createSlice({
  name: "configListSlice",
  initialState: {
    value: null as string[] | null,
    detail: null as any
  },
  reducers: {
    SetConfigListSlice: (
      state,
      action: {
        payload: string[] | null;
      }
    ) => {
      state.value = action.payload;
    },
    SetConfigDetailSlice: (
      state,
      action: {
        payload: any;
      }
    ) => {
      state.detail = action.payload;
    },
  },
});

export const { SetConfigListSlice, SetConfigDetailSlice } = configListSlice.actions;

export const configListSliceReducer = configListSlice.reducer;
