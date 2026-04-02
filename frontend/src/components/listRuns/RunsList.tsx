import { lazy, useEffect, useMemo, useState, Suspense } from "react";
import { useSelector } from "react-redux";
import { type RunListInterface } from "../../stores/slices/Base/runsListSlice";
import { GetRunIdsAPIHook, DeleteRunsAPIHook } from "../../customHooks/Runs/runsAPI";
import type { UserInfoInterface } from "../../stores/slices/Base/userInfoSlice";
import { Modal } from "rsuite";

const RunsPreviewModal = lazy(() => import("./RunsPreviewModal"));
const ButtonTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Button })),
);

const CheckboxTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Checkbox })),
);

interface ComponentStateInterface {
  selectedId: string;
  showModal: boolean;
  filterValue: string;
  selectedRunIds: string[];
  showDeleteConfirmModal: boolean;
}

function RunsListTag() {
  const [GetRunIdsAPI] = GetRunIdsAPIHook();
  const [DeleteRunsAPI] = DeleteRunsAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      showModal: false,
      filterValue: "",
      selectedRunIds: [],
      showDeleteConfirmModal: false,
    },
  );

  const runsListSlice: { value: RunListInterface[]; detail: string } =
    useSelector(
      (state: {
        runsListSlice: { value: RunListInterface[]; detail: string };
      }) => state.runsListSlice,
    );

  const userInfoSlice: { value: UserInfoInterface | null } = useSelector(
    (state: { userInfoSlice: { value: UserInfoInterface | null } }) =>
      state.userInfoSlice,
  );

  const isAdmin = (userInfoSlice?.value?.role ?? 0) === 1;

  const HandleSelectRunIdOnClick = (singleRunId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedId: singleRunId ?? "",
        showModal: true,
      };
    });
  };

  const HandleCloseModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showModal: false,
        selectedId: "",
      };
    });
  };

  const HandleFilterOnChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newValue = event.target.value ?? "";

    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        filterValue: newValue,
      };
    });
  };

  const HandleToggleRunSelection = (runId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      const isAlreadySelected = previousStateVal.selectedRunIds.includes(runId);

      return {
        ...previousStateVal,
        selectedRunIds: isAlreadySelected
          ? previousStateVal.selectedRunIds.filter(
              (singleId: string) => singleId !== runId,
            )
          : [...previousStateVal.selectedRunIds, runId],
      };
    });
  };

  const HandleClearSelection = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedRunIds: [],
      };
    });
  };

  const HandleOpenDeleteConfirmModal = () => {
    if (componentState.selectedRunIds.length <= 0) {
      return;
    }

    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteConfirmModal: true,
      };
    });
  };

  const HandleCloseDeleteConfirmModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteConfirmModal: false,
      };
    });
  };

  const HandleDeleteSelectedRuns = async () => {
    const idsToDelete = [...componentState.selectedRunIds];

    if (idsToDelete.length <= 0) {
      return;
    }

    DeleteRunsAPI({
      data: {
        run_ids: idsToDelete,
      },
      showLoader: true,
      showToast: true,
      saveResponse: false,
      EndCallback: () => {
        GetRunIdsAPI({
          saveResponse: true,
          showLoader: false,
        });

        setComponentState((previousStateVal: ComponentStateInterface) => {
          return {
            ...previousStateVal,
            selectedRunIds: [],
            showDeleteConfirmModal: false,
          };
        });
      },
    });
  };

  const filteredRunsList = useMemo(() => {
    const filterValueLowerCase = (
      componentState.filterValue ?? ""
    ).toLowerCase();

    return (runsListSlice?.value ?? [])
      .filter((singleRun: RunListInterface) => {
        if (!filterValueLowerCase) {
          return true;
        }

        const runIdValue = (singleRun?.run_id ?? "").toLowerCase();
        const typeValue = (singleRun?.type ?? "").toLowerCase();
        const emailValue = ((singleRun as any)?.email ?? "").toLowerCase();

        return (
          runIdValue.includes(filterValueLowerCase) ||
          typeValue.includes(filterValueLowerCase) ||
          emailValue.includes(filterValueLowerCase)
        );
      })
      .slice()
      .sort((a, b) => (b.run_id ?? "").localeCompare(a.run_id ?? ""));
  }, [runsListSlice?.value, componentState.filterValue]);

  useEffect(() => {
    GetRunIdsAPI({ saveResponse: true, showLoader: true });
  }, []);

  return (
    <>
      <div
        style={{
          backgroundColor: "#f9fafb",
          height: "100%",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "30px",
            marginLeft: "45px",
            marginRight: "45px",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "18px",
            }}
          >
            Runs
          </span>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <input
              value={componentState.filterValue}
              onChange={HandleFilterOnChange}
              placeholder="Filtra per run id, tipo o email"
              style={{
                width: "100%",
                maxWidth: "420px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "14px",
                color: "#111827",
                backgroundColor: "#ffffff",
                boxSizing: "border-box",
              }}
            />

            {isAdmin && componentState.selectedRunIds.length > 0 && (
              <Suspense fallback={<></>}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #dbe6ff",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#477dda",
                      fontWeight: 600,
                    }}
                  >
                    {componentState.selectedRunIds.length} run selezionate
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <ButtonTag
                      appearance="subtle"
                      onClick={HandleClearSelection}
                    >
                      Pulisci
                    </ButtonTag>

                    <ButtonTag
                      appearance="primary"
                      style={{
                        backgroundColor: "#477dda",
                        borderColor: "#477dda",
                      }}
                      onClick={HandleOpenDeleteConfirmModal}
                    >
                      Elimina
                    </ButtonTag>
                  </div>
                </div>
              </Suspense>
            )}
          </div>

          {filteredRunsList.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "16px",
                width: "100%",
                paddingBottom: "25px",
                boxSizing: "border-box",
              }}
            >
              {filteredRunsList.map((singleRun: RunListInterface) => {
                const runId = singleRun?.run_id ?? "";
                const isSelectedForDelete =
                  componentState.selectedRunIds.includes(runId);
                const isPreviewSelected =
                  componentState.selectedId === runId;

                return (
                  <div
                    key={runId}
                    className={`HoverTransform ${
                      isPreviewSelected ? "RunSelected" : ""
                    }`}
                    onClick={() => {
                      HandleSelectRunIdOnClick(runId);
                    }}
                    style={{
                      borderRadius: "12px",
                      padding: "16px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      boxSizing: "border-box",
                      minHeight: "160px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "all 0.18s ease",
                      backgroundColor: isSelectedForDelete ? "#f8fbff" : "#ffffff",
                      border: isSelectedForDelete
                        ? "1px solid #dbe6ff"
                        : "1px solid transparent",
                      position: "relative",
                    }}
                  >
                    {isAdmin && (
                      <div
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          zIndex: 2,
                          backgroundColor: "#ffffff",
                          borderRadius: "999px",
                          padding: "2px 4px",
                        }}
                      >
                        <Suspense fallback={<></>}>
                          <CheckboxTag
                            checked={isSelectedForDelete}
                            onChange={() => {
                              HandleToggleRunSelection(runId);
                            }}
                          />
                        </Suspense>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        minWidth: 0,
                        paddingRight: isAdmin ? "38px" : "0px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "var(--black)",
                          lineHeight: "1.4",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {runId}
                      </span>

                      <span
                        style={{
                          fontSize: "13px",
                          color: "#4b5563",
                          lineHeight: "1.4",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {(singleRun as any)?.email || "Email non disponibile"}
                      </span>

                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          lineHeight: "1.4",
                        }}
                      >
                        Clicca per aprire la preview completa
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "16px",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          backgroundColor: "#eef4ff",
                          color: "#477dda",
                          border: "1px solid #dbe6ff",
                          maxWidth: "100%",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {singleRun.type}
                      </span>

                      <span
                        style={{
                          fontSize: "12px",
                          color: isSelectedForDelete ? "#477dda" : "#9ca3af",
                          flexShrink: 0,
                          fontWeight: isSelectedForDelete ? 600 : 400,
                        }}
                      >
                        {isSelectedForDelete ? "Selezionata" : "Apri"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <span style={{ opacity: "60%" }}>
              {componentState.filterValue
                ? "Nessuna run trovata con il filtro selezionato"
                : "Nessuna run trovata"}
            </span>
          )}
        </div>
      </div>

      <RunsPreviewModal
        showModal={componentState.showModal}
        selectedId={componentState.selectedId}
        onClose={HandleCloseModal}
      />

      <Suspense fallback={<></>}>
        <Modal
          open={componentState.showDeleteConfirmModal}
          onClose={HandleCloseDeleteConfirmModal}
          size="xs"
        >
          <Modal.Header>
            <Modal.Title>Conferma eliminazione</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                color: "#374151",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              <span>
                Vuoi eliminare <strong>{componentState.selectedRunIds.length}</strong>{" "}
                run?
              </span>
              <span>Questa operazione non può essere annullata.</span>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <ButtonTag
              appearance="subtle"
              onClick={HandleCloseDeleteConfirmModal}
            >
              Annulla
            </ButtonTag>

            <ButtonTag
              appearance="primary"
              style={{
                backgroundColor: "#477dda",
                borderColor: "#477dda",
              }}
              onClick={HandleDeleteSelectedRuns}
            >
              Elimina
            </ButtonTag>
          </Modal.Footer>
        </Modal>
      </Suspense>
    </>
  );
}

export default RunsListTag;