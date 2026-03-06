import { createSlice } from "@reduxjs/toolkit";


export const currentPathSlice = createSlice({
  name: "currentPathSlice",
  initialState: {
    value: null as string | null,
  },
  reducers: {
    SetCurrentPathSlice: (
      state,
      action: {
        payload: string | null;
      }
    ) => {
      state.value = action.payload;
    },
  },
});

export const { SetCurrentPathSlice } = currentPathSlice.actions;

export const currentPathSliceReducer = currentPathSlice.reducer;
