import { createSlice } from "@reduxjs/toolkit";

export interface DeviceListStoreFileInterface {
  store: string;
  file: string;
}

export const deviceListListSlice = createSlice({
  name: "deviceListListSlice",
  initialState: {
    value: null as DeviceListStoreFileInterface[] | null,
    detail: null as any,
  },
  reducers: {
    SetDeviceListListSlice: (
      state,
      action: {
        payload: DeviceListStoreFileInterface[];
      },
    ) => {
      state.value = action.payload;
    },
    SetDeviceListDetailSlice: (
      state,
      action: {
        payload: any;
      },
    ) => {
      state.detail = action.payload;
    },
  },
});

export const { SetDeviceListListSlice, SetDeviceListDetailSlice } =
  deviceListListSlice.actions;

export const deviceListListSliceReducer = deviceListListSlice.reducer;
