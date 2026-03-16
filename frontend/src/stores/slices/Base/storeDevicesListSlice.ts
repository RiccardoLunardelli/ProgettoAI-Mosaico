import { createSlice } from "@reduxjs/toolkit";

export interface StoreDevicesListInterface {
  id: string;
  store_id: string;
  description: string;
  hd_plc: string;
  id_template: string;
}

export const storeDevicesListSlice = createSlice({
  name: "storeDevicesListSlice",
  initialState: {
    value: null as StoreDevicesListInterface[] | null,
  },
  reducers: {
    SetStoreDevicesListSlice: (
      state,
      action: {
        payload: StoreDevicesListInterface[] | null;
      },
    ) => {
      state.value = action.payload;
    },
  },
});

export const { SetStoreDevicesListSlice } = storeDevicesListSlice.actions;

export const storeDevicesListSliceReducer = storeDevicesListSlice.reducer;
