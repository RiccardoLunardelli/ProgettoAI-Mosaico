import { createSlice } from "@reduxjs/toolkit";

export interface DictionatyListInterface {
  id: string;
  name: string;
  version: string;
}

export interface DictionaryVersionScoreInterface {
  dictionary_version: string;
  templates: {
    run_id: string;
    template: string;
    template_path: string;
    score: number;
    created_at: string;
  }[];
  avg_score: number;
}

export const dictionaryListSlice = createSlice({
  name: "dictionaryListSlice",
  initialState: {
    value: null as DictionatyListInterface[] | null,
    detail: null as any,
    score: null as DictionaryVersionScoreInterface | null,
  },
  reducers: {
    SetDictionaryListSlice: (
      state,
      action: {
        payload: DictionatyListInterface[];
      },
    ) => {
      state.value = action.payload;
    },
    SetDictionaryDetailSlice: (
      state,
      action: {
        payload: any;
      },
    ) => {
      state.detail = action.payload;
    },
    SetDictionaryScoreSlice: (
      state,
      action: {
        payload: DictionaryVersionScoreInterface | null;
      },
    ) => {
      state.score = action.payload;
    },
  },
});

export const {
  SetDictionaryListSlice,
  SetDictionaryDetailSlice,
  SetDictionaryScoreSlice,
} = dictionaryListSlice.actions;

export const dictionaryListSliceReducer = dictionaryListSlice.reducer;
