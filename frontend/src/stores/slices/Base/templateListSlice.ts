import { createSlice } from "@reduxjs/toolkit";

export interface TemplatePercentualInterface {
  percent: number;
}

export const templateListSlice = createSlice({
  name: "templateListSlice",
  initialState: {
    value: null as string[] | null,
    detail: null as any,
    percentual: null as null | TemplatePercentualInterface,
  },
  reducers: {
    SetTemplateListSlice: (
      state,
      action: {
        payload: string[];
      },
    ) => {
      state.value = action.payload;
    },
    SetTemplateDetailSlice: (
      state,
      action: {
        payload: any;
      },
    ) => {
      state.detail = action.payload;
    },
    SetTemplatePercentualSlice: (
      state,
      action: {
        payload: TemplatePercentualInterface;
      },
    ) => {
      state.percentual = action.payload;
    },
  },
});

export const {
  SetTemplateListSlice,
  SetTemplateDetailSlice,
  SetTemplatePercentualSlice,
} = templateListSlice.actions;

export const templateListSliceReducer = templateListSlice.reducer;
