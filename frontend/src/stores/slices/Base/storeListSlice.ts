import { createSlice } from "@reduxjs/toolkit";

export interface StoreListInterface {
  id: string;
  client_id: string;
  name: string;
  content: {
    ID: string;
    enum: string;
    IDPTD: string;
    Plant: string;
    Enable: boolean;
    Address: string;
    PageURL: string;
    type_fam: string;
    PlantGroup: string;
    Description: string;
    TemplateGUID: string;
  }[];
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
