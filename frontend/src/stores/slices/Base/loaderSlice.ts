import { createSlice } from "@reduxjs/toolkit";

let loaderCount = 0;

export const loaderSlice = createSlice({
  name: "loaderSlice",
  initialState: {
    value: false,
  },
  reducers: {
    OpenLoader: (state) => {
      //Aumenta counter dei loader
      loaderCount = loaderCount + 1;

      //Apre il loader
      state.value = true;
    },
    CloseLoader: (state) => {
      //Diminuisce counter dei loader
      loaderCount = loaderCount - 1;

      //Se è < 0 lo riporta a zero
      if (loaderCount < 0) {
        loaderCount = 0;
      }

      //Se è 0 allora chiude i loader
      if (loaderCount == 0) {
        state.value = false;
      }
    },
  },
});

export const { OpenLoader, CloseLoader } = loaderSlice.actions;

export const loaderSliceReducer = loaderSlice.reducer;
