import { createSlice } from "@reduxjs/toolkit";
export interface RunListInterface {
    run_id: string,
    type: string,
}


export const runsListSlice = createSlice({
  name: "runsListSlice",
  initialState: {
    value: null as RunListInterface[] | null,
    detail: null as any
  },
  reducers: {
    SetRunsListSlice: (
      state,
      action: {
        payload: any;
      }
    ) => {
      state.value = action.payload;
    },
    SetRunDetailSlice: (
      state,
      action: {
        payload: any;
      }
    ) => {
      state.detail = action.payload;
    },
  },
});

export const { SetRunsListSlice, SetRunDetailSlice } = runsListSlice.actions;

export const runsListSliceReducer = runsListSlice.reducer;
