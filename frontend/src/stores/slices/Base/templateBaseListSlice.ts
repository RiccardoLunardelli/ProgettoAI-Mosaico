import { createSlice } from "@reduxjs/toolkit";

export interface TemplateBaseListInterface {
  id: string;
  name: string;
}

export const templateBaseListSlice = createSlice({
  name: "templateBaseListSlice",
  initialState: {
    value: null as TemplateBaseListInterface[] | null,
    detail: null as any,
    runIdTemplate: null as string[] | null,
    lastTemplate: null as string | null,
  },
  reducers: {
    SetTemplateBaseListSlice: (
      state,
      action: {
        payload: TemplateBaseListInterface[];
      },
    ) => {
      state.value = action.payload;
    },
    SetTemplateBaseDetailSlice: (
      state,
      action: {
        payload: any;
      },
    ) => {
      state.detail = action.payload;
    },
    SetRunIdTemplateDetailSlice: (
      state,
      action: {
        payload: string[];
      },
    ) => {
      state.runIdTemplate = action.payload;
    },
    SetLastTemplateBaseSlice: (
      state,
      action: {
        payload: string;
      },
    ) => {
      state.lastTemplate = action.payload;
    },
  },
});

export const {
  SetTemplateBaseListSlice,
  SetTemplateBaseDetailSlice,
  SetRunIdTemplateDetailSlice,
  SetLastTemplateBaseSlice
} = templateBaseListSlice.actions;

export const templateBaseListSliceReducer = templateBaseListSlice.reducer;
