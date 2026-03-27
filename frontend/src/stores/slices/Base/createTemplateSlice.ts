import { createSlice } from "@reduxjs/toolkit";



export const createTemplateSlice = createSlice({
  name: "createTemplateSlice",
  initialState: {
    schema: null as any | null,
  },
  reducers: {
    SetSchemaTemplateSlice: (
      state,
      action: {
        payload: any | null;
      }
    ) => {
      state.schema = action.payload;
    },
  },
});

export const { SetSchemaTemplateSlice } = createTemplateSlice.actions;

export const createTemplateSliceReducer = createTemplateSlice.reducer;
