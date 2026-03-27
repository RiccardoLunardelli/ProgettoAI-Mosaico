import { createSlice } from "@reduxjs/toolkit";

export interface SchemasListSliceInterface {
  id: string;
  name: string;
  version: string;
}

export const createTemplateSlice = createSlice({
  name: "createTemplateSlice",
  initialState: {
    schema: null as any | null,
    list: null as SchemasListSliceInterface[] | null,
  },
  reducers: {
    SetSchemaTemplateSlice: (
      state,
      action: {
        payload: any | null;
      },
    ) => {
      state.schema = action.payload;
    },
    SetSchemasListSlice: (
      state,
      action: {
        payload: SchemasListSliceInterface[] | null;
      },
    ) => {
      state.list = action.payload;
    },
  },
});

export const { SetSchemaTemplateSlice, SetSchemasListSlice } =
  createTemplateSlice.actions;

export const createTemplateSliceReducer = createTemplateSlice.reducer;
