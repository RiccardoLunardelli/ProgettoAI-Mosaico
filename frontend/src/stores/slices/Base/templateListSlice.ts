import { createSlice } from "@reduxjs/toolkit";

export interface TemplatePercentualInterface {
  percent: number;
}

export interface TemplateListInterface {
  id: string;
  name: string;
  version: string;
}

export interface TemplateListUsageInterface {
  template_id: string;
  template_name: string;
  template_version: string;
  client_id: string;
  client_name: string;
  store_id: string;
  store_name: string;
  device_id: string;
  device_description: string;
  device_hd_plc: string;
}

export const templateListSlice = createSlice({
  name: "templateListSlice",
  initialState: {
    value: null as TemplateListInterface[] | null,
    detail: null as any,
    percentual: null as null | TemplatePercentualInterface,
    usage: null as TemplateListUsageInterface[] | null,
  },
  reducers: {
    SetTemplateListSlice: (
      state,
      action: {
        payload: TemplateListInterface[];
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
    SetTemplateListUsageSlice: (
      state,
      action: {
        payload: TemplateListUsageInterface[] | null; 
      },
    ) => {
      state.usage = action.payload;
    },
  },
});

export const {
  SetTemplateListSlice,
  SetTemplateDetailSlice,
  SetTemplatePercentualSlice,
  SetTemplateListUsageSlice
} = templateListSlice.actions;

export const templateListSliceReducer = templateListSlice.reducer;
