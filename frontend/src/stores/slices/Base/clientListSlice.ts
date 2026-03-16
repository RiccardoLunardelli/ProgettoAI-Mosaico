import { createSlice } from "@reduxjs/toolkit";

export interface ClientListInterface {
  id: string;
  name: string;
}

export const clientListSlice = createSlice({
  name: "clientListSlice",
  initialState: {
    value: null as ClientListInterface[] | null,
  },
  reducers: {
    SetClientListSlice: (
      state,
      action: {
        payload: ClientListInterface[] | null;
      },
    ) => {
      state.value = action.payload;
    },
  },
});

export const { SetClientListSlice } = clientListSlice.actions;

export const clientListSliceReducer = clientListSlice.reducer;
