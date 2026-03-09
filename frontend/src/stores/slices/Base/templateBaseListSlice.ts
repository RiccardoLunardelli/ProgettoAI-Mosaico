import { createSlice } from "@reduxjs/toolkit";



export const templateBaseListSlice = createSlice({
  name: "templateBaseListSlice",
  initialState: {
    value: null as string[] | null,
    detail: null as any,
    runIdTemplate: null as string[] | null
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
    SetRunIdTemplateDetailSlice: (
      state,
      action: {
        payload: string[];
      }
    ) => {
      state.runIdTemplate = action.payload;
    },
  },
});

export const { SetTemplateBaseListSlice, SetTemplateBaseDetailSlice, SetRunIdTemplateDetailSlice } = templateBaseListSlice.actions;

export const templateBaseListSliceReducer = templateBaseListSlice.reducer;
