import { createSlice } from "@reduxjs/toolkit";

export interface InputSliceInputInterface {
  id: string;
  value: any;
}

export const inputSlice = createSlice({
  name: "inputSlice",
  initialState: {
    value: {},
  },
  reducers: {
    SetInputSlice: (
      state,
      action: {
        payload: InputSliceInputInterface;
      },
    ) => {
      (state.value as any)[action.payload.id] = action.payload.value;
    },
  },
});

export const { SetInputSlice } = inputSlice.actions;

export const inputSliceReducer = inputSlice.reducer;
