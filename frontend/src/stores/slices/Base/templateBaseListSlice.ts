import { createSlice } from "@reduxjs/toolkit";



export const templateBaseListSlice = createSlice({
  name: "templateBaseListSlice",
  initialState: {
    value: null as string[] | null,
    detail: null as any
  },
  reducers: {
    SetTemplateBaseListSlice: (
      state,
      action: {
        payload: string[];
      }
    ) => {
      state.value = action.payload;
    },
    SetTemplateBaseDetailSlice: (
      state,
      action: {
        payload: any;
      }
    ) => {
      state.detail = action.payload;
    },
  },
});

export const { SetTemplateBaseListSlice, SetTemplateBaseDetailSlice } = templateBaseListSlice.actions;

export const templateBaseListSliceReducer = templateBaseListSlice.reducer;
