import { createSlice } from "@reduxjs/toolkit";

export interface ConfigListInterface {
  id: string;
  name: string;
  version: string;
}


export const configListSlice = createSlice({
  name: "configListSlice",
  initialState: {
    value: null as ConfigListInterface[] | null,
    detail: null as any
  },
  reducers: {
    SetConfigListSlice: (
      state,
      action: {
        payload: ConfigListInterface[] | null;
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
