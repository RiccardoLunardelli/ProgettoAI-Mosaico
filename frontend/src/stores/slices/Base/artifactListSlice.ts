import { createSlice } from "@reduxjs/toolkit";

export interface ArtifactListInterface {
  id: string;
  type: string;
  name: string;
  version: string;
  schema_id: string;
  schema_name: string;
  schema_version: string;
}

export const artifactListSlice = createSlice({
  name: "artifactListSlice",
  initialState: {
    value: null as ArtifactListInterface[] | null,
    detail: null as any,
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
    SetArtifactDetailListSlice: (
      state,
      action: {
        payload: any;
      },
    ) => {
      state.detail = action.payload;
    },
  },
});

export const { SetArtifactListSlice, SetArtifactDetailListSlice } = artifactListSlice.actions;

export const artifactListSliceReducer = artifactListSlice.reducer;
