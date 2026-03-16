import { createSlice } from "@reduxjs/toolkit";

export interface StoreListInterface {
  id: string;
  client_id: string;
  name: string;
}

export const storeListSlice = createSlice({
  name: "storeListSlice",
  initialState: {
    value: null as StoreListInterface[] | null,
  },
  reducers: {
    SetStoreListSlice: (
      state,
      action: {
        payload: StoreListInterface[] | null;
      },
    ) => {
      state.value = action.payload;
    },
  },
});

export const { SetStoreListSlice } = storeListSlice.actions;

export const storeListSliceReducer = storeListSlice.reducer;
