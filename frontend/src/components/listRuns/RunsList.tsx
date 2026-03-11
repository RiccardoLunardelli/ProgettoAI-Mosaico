import { lazy, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { type RunListInterface } from "../../stores/slices/Base/runsListSlice";
import { GetRunDetailAPIHook, GetRunIdsAPIHook } from "../../customHooks/Runs/runsAPI";

const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));

interface ComponentStateInterface {
  selectedId: string;
  showModal: boolean;
}

function RunsListTag() {
  const [GetRunDetailAPI] = GetRunDetailAPIHook();
  const [GetRunIdsAPI] = GetRunIdsAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      showModal: false,
    },
  );

  const runsListSlice: { value: RunListInterface[]; detail: string } =
    useSelector(
      (state: {
        runsListSlice: { value: RunListInterface[]; detail: string };
      }) => state.runsListSlice,
    );

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

  useEffect(() => {
    if (!componentState.selectedId || !componentState.showModal) return;

    GetRunDetailAPI({
      data: { run_id: componentState.selectedId },
      showLoader: true,
      saveResponse: true,
    });
  }, [componentState.selectedId, componentState.showModal]);

  useEffect(() => {
    GetRunIdsAPI({ saveResponse: true, showLoader: true });
  }, [])

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

          {(runsListSlice?.value ?? []).length > 0 ? (
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
              {(runsListSlice?.value ?? [])
                .slice()
                .sort((a, b) => (b.run_id ?? "").localeCompare(a.run_id ?? ""))
                .map((singleRun: RunListInterface) => {
                  const isSelected =
                    componentState.selectedId === (singleRun?.run_id ?? "");

                  return (
                    <div
                      key={singleRun?.run_id ?? ""}
                      className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                      onClick={() => {
                        HandleSelectRunIdOnClick(singleRun.run_id);
                      }}
                      style={{
                        borderRadius: "12px",
                        padding: "16px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        boxSizing: "border-box",
                        minHeight: "130px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        overflow: "hidden",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          minWidth: 0,
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
                          {singleRun.run_id}
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
                            color: "#9ca3af",
                            flexShrink: 0,
                          }}
                        >
                          Apri
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <span style={{ opacity: "60%" }}>Nessuna run trovata</span>
          )}
        </div>
      </div>

      {componentState.showModal ? (
        <div
          onClick={HandleCloseModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            zIndex: 9999,
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
              width: "min(1100px, 92vw)",
              height: "min(82vh, 820px)",
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.20)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                minHeight: "72px",
                height: "72px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 22px",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Preview run
                </span>

                <span
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "800px",
                  }}
                >
                  {componentState.selectedId}
                </span>
              </div>

              <button
                onClick={HandleCloseModal}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: "#f8fafc",
                padding: "18px",
                boxSizing: "border-box",
                overflow: "auto",
              }}
            >
              {runsListSlice.detail && componentState.selectedId !== "" ? (
                <pre
                  style={{
                    margin: 0,
                    textAlign: "left",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    width: "100%",
                    color: "#111827",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                >
                  {JSON.stringify(runsListSlice.detail, null, 2)}
                </pre>
              ) : (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                >
                  <RunsListSkeleton />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export default RunsListTag;
