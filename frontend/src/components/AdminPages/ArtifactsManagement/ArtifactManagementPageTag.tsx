import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ArtifactListInterface } from "../../../stores/slices/Base/artifactListSlice";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import { DeleteArtifactListAPIHook, GetArtifactListAPIHook } from "../../../customHooks/API/Artifact/ArtifactAPI";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const InsertArtifactManagementModalTag = lazy(
  () => import("./InsertArtifactManagementModalTag"),
);

interface ComponentStateInterface {
  selectedName: string;
  showInsertModal: boolean;
}

function ArtifactManagementPageTag() {
  const dispatch = useDispatch();
  const [GetArtifactListAPI] = GetArtifactListAPIHook();
  const [DeleteArtifactListAPI] = DeleteArtifactListAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedName: "",
      showInsertModal: false,
    },
  );

  const artifactListSlice: {
    value: ArtifactListInterface[];
  } = useSelector(
    (state: {
      artifactListSlice: {
        value: ArtifactListInterface[];
      };
    }) => state.artifactListSlice,
  );

  const selectedArtifact = useMemo(() => {
    return (artifactListSlice?.value ?? []).find(
      (singleArtifact: ArtifactListInterface) =>
        singleArtifact?.name === componentState.selectedName,
    );
  }, [artifactListSlice?.value, componentState.selectedName]);

  const HandleRefreshList = () => {
    GetArtifactListAPI({
      showLoader: true,
      saveResponse: true,
    });
  };

  const HandleDeleteArtifactOnClick = () => {
    if (!componentState.selectedName) return;

    DeleteArtifactListAPI({
      showLoader: true,
      showToast: true,
      saveResponse: false,
      data: {
        name: componentState.selectedName,
      },
      EndCallback() {
        setComponentState((previousStateVal: ComponentStateInterface) => {
          return {
            ...previousStateVal,
            selectedName: "",
          };
        });

        HandleRefreshList();
      },
    });
  };

  useEffect(() => {
    HandleRefreshList();

    dispatch(
      SetInputSlice({
        id: "InsertArtifactManagement-Name",
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: "InsertArtifactManagement-Type",
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: "InsertArtifactManagement-Version",
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: "InsertArtifactManagement-Content",
        value: "",
      }),
    );
  }, []);

  return (
    <>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <span
            style={{
              fontSize: "24px",
              fontWeight: 600,
            }}
          >
            Artifact Management
          </span>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <Suspense fallback="">
              <BasicButtonGenericTag
                textToSee="Inserisci artifact"
                clickCallBack={() => {
                  setComponentState(
                    (previousStateVal: ComponentStateInterface) => {
                      return {
                        ...previousStateVal,
                        showInsertModal: true,
                      };
                    },
                  );
                }}
              />
            </Suspense>

            <Suspense fallback="">
              <BasicButtonGenericTag
                textToSee="Aggiorna lista"
                clickCallBack={() => {
                  HandleRefreshList();
                }}
              />
            </Suspense>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            width: "100%",
            height: "calc(100% - 60px)",
          }}
        >
          {/* Lista artifact */}
          <div
            style={{
              width: "32%",
              minWidth: "320px",
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "14px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              Lista artifact
            </span>

            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
              }}
            >
              {(artifactListSlice?.value ?? []).length > 0 ? (
                <>
                  {(artifactListSlice?.value ?? []).map(
                    (singleArtifact: ArtifactListInterface) => {
                      const isSelected =
                        componentState.selectedName === singleArtifact?.name;

                      return (
                        <div
                          key={`${singleArtifact?.name}-${singleArtifact?.version}`}
                          className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                          style={{
                            borderRadius: "8px",
                            padding: "10px 12px",
                            width: "100%",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "var(--black)",
                            marginTop: "8px",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                          onClick={() => {
                            setComponentState(
                              (
                                previousStateVal: ComponentStateInterface,
                              ) => {
                                return {
                                  ...previousStateVal,
                                  selectedName: singleArtifact?.name ?? "",
                                };
                              },
                            );
                          }}
                        >
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                            }}
                          >
                            {singleArtifact?.name ?? "-"}
                          </span>

                          <span
                            style={{
                              fontSize: "12px",
                              opacity: 0.7,
                            }}
                          >
                            Type: {singleArtifact?.type ?? "-"}
                          </span>

                          <span
                            style={{
                              fontSize: "12px",
                              opacity: 0.7,
                            }}
                          >
                            Version: {singleArtifact?.version ?? "-"}
                          </span>
                        </div>
                      );
                    },
                  )}
                </>
              ) : (
                <RunsListSkeleton />
              )}
            </div>
          </div>

          {/* Preview artifact */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "14px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                Dettaglio artifact
              </span>

              <Suspense fallback="">
                <BasicButtonGenericTag
                  textToSee="Elimina"
                  disabledButton={componentState.selectedName === ""}
                  clickCallBack={() => {
                    HandleDeleteArtifactOnClick();
                  }}
                />
              </Suspense>
            </div>

            {selectedArtifact ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "18px",
                  }}
                >
                  <span>
                    <b>Name:</b> {selectedArtifact?.name ?? "-"}
                  </span>
                  <span>
                    <b>Type:</b> {selectedArtifact?.type ?? "-"}
                  </span>
                  <span>
                    <b>Version:</b> {selectedArtifact?.version ?? "-"}
                  </span>
                </div>

                <span
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Content
                </span>

                <pre
                  style={{
                    margin: 0,
                    textAlign: "left",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: "13px",
                    width: "100%",
                    backgroundColor: "#eef2f7",
                    borderRadius: "8px",
                    padding: "12px",
                    boxSizing: "border-box",
                    minHeight: "300px",
                  }}
                >
                  {JSON.stringify(selectedArtifact?.content ?? {}, null, 2)}
                </pre>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.5,
                  fontSize: "14px",
                }}
              >
                Seleziona un artifact dalla lista
              </div>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback="">
        <InsertArtifactManagementModalTag
          showModal={componentState.showInsertModal}
          onClose={() => {
            setComponentState((previousStateVal: ComponentStateInterface) => {
              return {
                ...previousStateVal,
                showInsertModal: false,
              };
            });

            HandleRefreshList();
          }}
        />
      </Suspense>
    </>
  );
}

export default ArtifactManagementPageTag;