import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import type { ArtifactListInterface } from "../../../stores/slices/Base/artifactListSlice";
import {
  GetArtifactListAPIHook,
  GetArtifactListDetailAPIHook,
  DeleteArtifactListAPIHook,
} from "../../../customHooks/API/Artifact/ArtifactAPI";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const InsertArtifactManagementModalTag = lazy(
  () => import("./InsertArtifactManagementModal"),
);

const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);

interface ComponentStateInterface {
  selectedArtifactIds: string[];
  lastSelectedArtifactId: string;
  showModal: boolean;
  showDeleteModal: boolean;
  deletingArtifactIds: string[];
  filterType: string;
}

function ArtifactManagementPageTag() {
  const [GetArtifactListAPI] = GetArtifactListAPIHook();
  const [GetArtifactListDetailAPI] = GetArtifactListDetailAPIHook();
  const [DeleteArtifactListAPI] = DeleteArtifactListAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedArtifactIds: [],
      lastSelectedArtifactId: "",
      showModal: false,
      showDeleteModal: false,
      deletingArtifactIds: [],
      filterType: "",
    },
  );

  const artifactListSlice: {
    value: ArtifactListInterface[];
    detail: any;
  } = useSelector(
    (state: {
      artifactListSlice: {
        value: ArtifactListInterface[];
        detail: any;
      };
    }) => state.artifactListSlice,
  );

  const selectedArtifacts = useMemo(() => {
    return (artifactListSlice?.value ?? []).filter(
      (singleArtifact: ArtifactListInterface) =>
        componentState.selectedArtifactIds.includes(
          String(singleArtifact?.id ?? ""),
        ),
    );
  }, [artifactListSlice?.value, componentState.selectedArtifactIds]);

  const previewArtifact = useMemo(() => {
    const lastSelectedId = String(componentState.lastSelectedArtifactId ?? "");

    if (lastSelectedId) {
      const foundArtifact = (artifactListSlice?.value ?? []).find(
        (singleArtifact: ArtifactListInterface) =>
          String(singleArtifact?.id ?? "") === lastSelectedId,
      );

      if (foundArtifact) {
        return foundArtifact;
      }
    }

    if (selectedArtifacts.length > 0) {
      return selectedArtifacts[selectedArtifacts.length - 1];
    }

    return null;
  }, [
    artifactListSlice?.value,
    componentState.lastSelectedArtifactId,
    selectedArtifacts,
  ]);

  const deletingArtifacts = useMemo(() => {
    return (artifactListSlice?.value ?? []).filter(
      (singleArtifact: ArtifactListInterface) =>
        componentState.deletingArtifactIds.includes(
          String(singleArtifact?.id ?? ""),
        ),
    );
  }, [artifactListSlice?.value, componentState.deletingArtifactIds]);

  const typeOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(
        (artifactListSlice?.value ?? [])
          .map((singleArtifact: ArtifactListInterface) =>
            String(singleArtifact?.type ?? "").trim(),
          )
          .filter((singleType: string) => singleType !== ""),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { label: "Tutti", value: "" },
      ...uniqueTypes.map((singleType: string) => ({
        label: singleType,
        value: singleType,
      })),
    ];
  }, [artifactListSlice?.value]);

  const filteredArtifactList = useMemo(() => {
    if (!componentState.filterType) {
      return artifactListSlice?.value ?? [];
    }

    return (artifactListSlice?.value ?? []).filter(
      (singleArtifact: ArtifactListInterface) =>
        String(singleArtifact?.type ?? "") ===
        String(componentState.filterType),
    );
  }, [artifactListSlice?.value, componentState.filterType]);

  const HandleRefreshList = () => {
    GetArtifactListAPI({
      showLoader: true,
      saveResponse: true,
    });
  };

  const HandleOpenInsertModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showModal: true,
      };
    });
  };

  const HandleCloseInsertModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showModal: false,
      };
    });

    HandleRefreshList();
  };

  const HandleArtifactOnClick = (artifactId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      const artifactIdString = String(artifactId ?? "");
      const alreadySelected =
        previousStateVal.selectedArtifactIds.includes(artifactIdString);

      if (alreadySelected) {
        const newSelectedIds = previousStateVal.selectedArtifactIds.filter(
          (singleId: string) => String(singleId) !== artifactIdString,
        );

        return {
          ...previousStateVal,
          selectedArtifactIds: newSelectedIds,
          lastSelectedArtifactId:
            String(previousStateVal.lastSelectedArtifactId) === artifactIdString
              ? newSelectedIds[newSelectedIds.length - 1] ?? ""
              : previousStateVal.lastSelectedArtifactId,
        };
      }

      return {
        ...previousStateVal,
        selectedArtifactIds: [
          ...previousStateVal.selectedArtifactIds,
          artifactIdString,
        ],
        lastSelectedArtifactId: artifactIdString,
      };
    });
  };

  const HandleClearSelection = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedArtifactIds: [],
        lastSelectedArtifactId: "",
      };
    });
  };

  const HandleOpenDeleteModal = (artifactIds: string[]) => {
    const cleanIds = artifactIds.filter(Boolean);

    if (cleanIds.length === 0) return;

    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: true,
        deletingArtifactIds: cleanIds,
      };
    });
  };

  const HandleCloseDeleteModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: false,
        deletingArtifactIds: [],
      };
    });
  };

  const HandleConfirmDeleteOnClick = () => {
    const artifactIdsToDelete = componentState.deletingArtifactIds ?? [];

    if (artifactIdsToDelete.length === 0) return;

    DeleteArtifactListAPI({
      showLoader: true,
      showToast: true,
      data: {
        ids: artifactIdsToDelete,
      },
      EndCallback() {
        setComponentState((previousStateVal: ComponentStateInterface) => {
          const newSelectedIds = previousStateVal.selectedArtifactIds.filter(
            (singleId: string) => !artifactIdsToDelete.includes(singleId),
          );

          const currentLastSelectedId = String(
            previousStateVal.lastSelectedArtifactId ?? "",
          );

          const newLastSelectedId = artifactIdsToDelete.includes(
            currentLastSelectedId,
          )
            ? newSelectedIds[newSelectedIds.length - 1] ?? ""
            : currentLastSelectedId;

          return {
            ...previousStateVal,
            showDeleteModal: false,
            deletingArtifactIds: [],
            selectedArtifactIds: newSelectedIds,
            lastSelectedArtifactId: newLastSelectedId,
          };
        });

        HandleRefreshList();
      },
    });
  };

  useEffect(() => {
    HandleRefreshList();
  }, []);

  useEffect(() => {
    if (!previewArtifact?.id) return;

    GetArtifactListDetailAPI({
      data: {
        id: String(previewArtifact.id),
      },
      showLoader: true,
      saveResponse: true,
    });
  }, [previewArtifact?.id]);

  const selectedForBulkDeleteCount = componentState.selectedArtifactIds.length;

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
              alignItems: "center",
            }}
          >
            <button
              onClick={() =>
                HandleOpenDeleteModal(componentState.selectedArtifactIds)
              }
              disabled={selectedForBulkDeleteCount === 0}
              style={{
                height: "40px",
                padding: "0 16px",
                borderRadius: "10px",
                border:
                  selectedForBulkDeleteCount === 0
                    ? "1px solid #d1d5db"
                    : "1px solid #dc2626",
                backgroundColor:
                  selectedForBulkDeleteCount === 0 ? "#f3f4f6" : "#ef4444",
                color: selectedForBulkDeleteCount === 0 ? "#9ca3af" : "#ffffff",
                cursor:
                  selectedForBulkDeleteCount === 0 ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              Elimina selezionati
              {selectedForBulkDeleteCount > 0
                ? ` (${selectedForBulkDeleteCount})`
                : ""}
            </button>

            <button
              onClick={HandleClearSelection}
              disabled={selectedForBulkDeleteCount === 0}
              style={{
                height: "40px",
                padding: "0 16px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                backgroundColor:
                  selectedForBulkDeleteCount === 0 ? "#f3f4f6" : "#ffffff",
                color: selectedForBulkDeleteCount === 0 ? "#9ca3af" : "#374151",
                cursor:
                  selectedForBulkDeleteCount === 0 ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              Deseleziona tutto
            </button>

            <Suspense fallback="">
              <BasicButtonGenericTag
                textToSee="Inserisci"
                clickCallBack={HandleOpenInsertModal}
              />
            </Suspense>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            width: "100%",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              width: "34%",
              minWidth: "320px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "10px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                margin: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                }}
              >
                Artifact
              </div>

              <div style={{ minWidth: "180px" }}>
                <Suspense fallback="">
                  <SelectPickerTag
                    data={typeOptions}
                    value={componentState.filterType}
                    cleanable={false}
                    searchable={false}
                    placeholder="Filtra per type"
                    onChange={(value: any) => {
                      setComponentState(
                        (previousStateVal: ComponentStateInterface) => {
                          return {
                            ...previousStateVal,
                            filterType: value ?? "",
                          };
                        },
                      );
                    }}
                    style={{ width: "100%" }}
                  />
                </Suspense>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                padding: "0 10px 10px 10px",
                boxSizing: "border-box",
              }}
            >
              {(filteredArtifactList ?? []).length > 0 ? (
                <>
                  {(filteredArtifactList ?? []).map(
                    (singleArtifact: ArtifactListInterface) => {
                      const artifactId = String(singleArtifact.id ?? "");
                      const isSelected =
                        componentState.selectedArtifactIds.includes(artifactId);

                      return (
                        <div
                          key={`${singleArtifact.id}`}
                          className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                          style={{
                            borderRadius: "8px",
                            padding: "8px 10px",
                            width: "100%",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "var(--black)",
                            marginTop: "8px",
                            display: "flex",
                            flexDirection: "column",
                            boxSizing: "border-box",
                            position: "relative",
                            border: isSelected
                              ? "1px solid #477dda"
                              : undefined,
                            backgroundColor: isSelected ? "#eef4ff" : undefined,
                          }}
                          onClick={() => {
                            HandleArtifactOnClick(artifactId);
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              HandleOpenDeleteModal([artifactId]);
                            }}
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              fontSize: "20px",
                              color: "#ef4444",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            delete
                          </span>

                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              paddingRight: "28px",
                            }}
                          >
                            {singleArtifact.name}
                          </span>

                          <span
                            style={{
                              fontSize: "12px",
                              opacity: "0.7",
                              marginTop: "3px",
                            }}
                          >
                            {singleArtifact.type} - v{singleArtifact.version}
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

          <div
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "10px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <div
              style={{
                margin: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                }}
              >
                Dettaglio
              </span>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <Suspense fallback="">
                  <BasicButtonGenericTag
                    textToSee="Elimina"
                    disabledButton={!previewArtifact}
                    clickCallBack={() => {
                      if (!previewArtifact?.id) return;
                      HandleOpenDeleteModal([String(previewArtifact.id)]);
                    }}
                  />
                </Suspense>
              </div>
            </div>

            {previewArtifact ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  padding: "0 10px 10px 10px",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                {componentState.selectedArtifactIds.length > 1 ? (
                  <div
                    style={{
                      marginBottom: "14px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      backgroundColor: "#eef4ff",
                      color: "#1d4ed8",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Hai selezionato {componentState.selectedArtifactIds.length} artifact.
                    In anteprima stai vedendo l’ultimo selezionato.
                  </div>
                ) : (
                  <></>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "14px",
                    fontSize: "14px",
                  }}
                >
                  <span>
                    <b>ID:</b> {previewArtifact.id ?? "-"}
                  </span>
                  <span>
                    <b>Name:</b> {previewArtifact.name ?? "-"}
                  </span>
                  <span>
                    <b>Type:</b> {previewArtifact.type ?? "-"}
                  </span>
                  <span>
                    <b>Version:</b> {previewArtifact.version ?? "-"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    opacity: "0.7",
                    marginBottom: "8px",
                    fontWeight: 500,
                  }}
                >
                  CONTENT
                </div>

                <div
                  style={{
                    flex: 1,
                    overflow: "auto",
                    backgroundColor: "#f3f5f7",
                    borderRadius: "8px",
                    padding: "12px",
                    boxSizing: "border-box",
                    minHeight: "300px",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      textAlign: "left",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "13px",
                      width: "100%",
                    }}
                  >
                    {JSON.stringify(artifactListSlice?.detail ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: "0.5",
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
          showModal={componentState.showModal}
          onClose={HandleCloseInsertModal}
        />
      </Suspense>

      {componentState.showDeleteModal ? (
        <div
          onClick={HandleCloseDeleteModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(480px, 92vw)",
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.20)",
              padding: "22px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              maxHeight: "80vh",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Elimina artifact
              </span>

              <span
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                Sei sicuro di voler eliminare{" "}
                <span style={{ fontWeight: 600, color: "#111827" }}>
                  {deletingArtifacts.length === 1
                    ? (deletingArtifacts[0]?.name ?? "questo artifact")
                    : `${deletingArtifacts.length} artifact`}
                </span>
                ?
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e5e7eb",
                overflow: "auto",
                maxHeight: "240px",
              }}
            >
              {deletingArtifacts.map(
                (singleArtifact: ArtifactListInterface) => {
                  return (
                    <div
                      key={String(singleArtifact.id ?? "")}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#374151" }}>
                        <b>Name:</b> {singleArtifact?.name ?? "-"}
                      </span>
                      <span style={{ fontSize: "13px", color: "#374151" }}>
                        <b>ID:</b> {singleArtifact?.id ?? "-"}
                      </span>
                      <span style={{ fontSize: "13px", color: "#374151" }}>
                        <b>Type:</b> {singleArtifact?.type ?? "-"}
                      </span>
                      <span style={{ fontSize: "13px", color: "#374151" }}>
                        <b>Version:</b> {singleArtifact?.version ?? "-"}
                      </span>
                    </div>
                  );
                },
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={HandleCloseDeleteModal}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Annulla
              </button>

              <button
                onClick={HandleConfirmDeleteOnClick}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "1px solid #dc2626",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Sì, elimina
              </button>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export default ArtifactManagementPageTag;