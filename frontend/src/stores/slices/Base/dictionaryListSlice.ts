import { createSlice } from "@reduxjs/toolkit";

export interface DictionatyListInterface {
  id: string;
  name: string;
}

export const dictionaryListSlice = createSlice({
  name: "dictionaryListSlice",
  initialState: {
    value: null as DictionatyListInterface[] | null,
    detail: null as any,
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
  },
});

export const { SetDictionaryListSlice, SetDictionaryDetailSlice } =
  dictionaryListSlice.actions;

export const dictionaryListSliceReducer = dictionaryListSlice.reducer;
