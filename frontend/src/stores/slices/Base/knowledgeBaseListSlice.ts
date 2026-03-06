import { createSlice } from "@reduxjs/toolkit";



export const knowledgeBaseListSlice = createSlice({
  name: "knowledgeBaseListSlice",
  initialState: {
    value: null as string[] | null,
    detail: null as any
  },
  reducers: {
    SetKnowledgeBaseListSlice: (
      state,
      action: {
        payload: string[];
      }
    ) => {
      state.value = action.payload;
    },
    SetKnowledgeBaseDetailSlice: (
      state,
      action: {
        payload: any;
      }
    ) => {
      state.detail = action.payload;
    },
  },
});

export const { SetKnowledgeBaseListSlice, SetKnowledgeBaseDetailSlice } = knowledgeBaseListSlice.actions;

export const knowledgeBaseListSliceReducer = knowledgeBaseListSlice.reducer;
