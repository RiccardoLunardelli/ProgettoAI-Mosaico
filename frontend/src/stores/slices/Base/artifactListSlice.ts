import { createSlice } from "@reduxjs/toolkit";

export interface ArtifactListInterface {
  id: string;
  type: string;
  name: string;
  version: string;
}

export const artifactListSlice = createSlice({
  name: "artifactListSlice",
  initialState: {
    value: null as ArtifactListInterface[] | null,
  },
  reducers: {
    SetArtifactListSlice: (
      state,
      action: {
        payload: ArtifactListInterface[] | null;
      },
    ) => {
      state.value = action.payload;
      state.value = action.payload;
    },
  },
});

export const { SetArtifactListSlice } = artifactListSlice.actions;

export const artifactListSliceReducer = artifactListSlice.reducer;
