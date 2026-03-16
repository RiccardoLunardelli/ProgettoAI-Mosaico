import { lazy, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { type RunListInterface } from "../../stores/slices/Base/runsListSlice";
import { GetRunIdsAPIHook } from "../../customHooks/Runs/runsAPI";

const RunsPreviewModalTag = lazy(() => import("./RunsPreviewModal"));

interface ComponentStateInterface {
  selectedId: string;
  showModal: boolean;
}

function RunsListTag() {
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

      <RunsPreviewModalTag
        showModal={componentState.showModal}
        selectedId={componentState.selectedId}
        onClose={HandleCloseModal}
      />
    </>
  );
}

export default RunsListTag;
