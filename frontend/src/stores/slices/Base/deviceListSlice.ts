import { createSlice } from "@reduxjs/toolkit";

export interface DeviceListStoreFileInterface {
  store: string;
  file: string;
  id: string;
}

export interface DeviceListEnumInterface {
  [key: string]: string
}

export const deviceListListSlice = createSlice({
  name: "deviceListListSlice",
  initialState: {
    value: null as DeviceListStoreFileInterface[] | null,
    detail: null as any,
    enrichedValue: null as DeviceListStoreFileInterface[] | null,
    enrichedDetail: null as any,
    enum: null as DeviceListEnumInterface | null
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
    SetEnrichedValueSlice: (
      state,
      action: {
        payload: DeviceListStoreFileInterface[];
      },
    ) => {
      state.enrichedValue = action.payload;
    },
    SetEnrichedDetailSlice: (
      state,
      action: {
        payload: any;
      },
    ) => {
      state.enrichedDetail = action.payload;
    },
    SetEnumDeviceListSlice: (
      state,
      action: {
        payload: DeviceListEnumInterface;
      },
    ) => {
      state.enum = action.payload;
    },
  },
});

export const { SetDeviceListListSlice, SetDeviceListDetailSlice, SetEnrichedValueSlice, SetEnrichedDetailSlice, SetEnumDeviceListSlice } =
  deviceListListSlice.actions;

export const deviceListListSliceReducer = deviceListListSlice.reducer;
