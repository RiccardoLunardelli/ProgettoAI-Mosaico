import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  SetRunDetailSlice,
  type RunListInterface,
} from "../../stores/slices/Base/runsListSlice";
import { GetRunDetailAPIHook } from "../../customHooks/Runs/runsAPI";
import RunsListSkeleton from "../Skeleton/RunsListSkeleton";

interface ComponentStateInterface {
  selectedId: string;
}

function RunsListTag() {
  const dispatch = useDispatch();
  const [GetRunDetailAPI] = GetRunDetailAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
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
      };
    });
  };

  useEffect(() => {
    if (componentState.selectedId == "") return;
    GetRunDetailAPI({
      data: { run_id: componentState.selectedId },
      showLoader: true,
      saveResponse: true,
    });

    dispatch(SetRunDetailSlice(null));
  }, [componentState.selectedId]);

  return (
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
      {/* Card Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "30px",
          marginLeft: "45px",
        }}
      >
        {/* Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            width: "35vw",
            height: "30vh",
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              margin: "10px",
              alignItems: "flex-start",
              width: "100%",
              height: "100%",
            }}
          >
            <span style={{ fontSize: "20px", fontWeight: 600 }}>Runs</span>

            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                marginTop: "10px",
              }}
            >
              {(runsListSlice?.value ?? []).length > 0 ? (
                <>
                  {(runsListSlice?.value ?? []).map(
                    (singleRun: RunListInterface) => {
                      const isSelected =
                        componentState.selectedId === (singleRun?.run_id ?? "");

                      return (
                        <div
                          key={singleRun?.run_id ?? ""}
                          className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                          style={{
                            borderRadius: "8px",
                            padding: "6px 10px",
                            width: "95%",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "var(--black)",
                            marginTop: "8px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                          onClick={() => {
                            HandleSelectRunIdOnClick(singleRun.run_id);
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: 500 }}>
                            {singleRun.run_id}
                          </span>

                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              backgroundColor: "#eef4ff",
                              color: "#477dda",
                              border: "1px solid #dbe6ff",
                              width: "20%",
                            }}
                          >
                            {singleRun.type}
                          </span>
                        </div>
                      );
                    },
                  )}
                </>
              ) : (
                <span style={{opacity: "60%"}}>Nessuna run trovata</span>
              )}
            </div>
          </div>
        </div>

        {/* Card */}
        {runsListSlice.detail && componentState.selectedId !== "" ? (
          <>
            <div style={{ marginTop: "20px", display: "flex", opacity: "50%" }}>
              Preview run
            </div>
            <div
              style={{
                backgroundColor: "#f3f5f7",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                boxSizing: "border-box",
                width: "50vw",
                height: "50vh",
                display: "flex",
                justifyContent: "flex-start",
                overflow: "auto",
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
                {JSON.stringify(runsListSlice.detail, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <>{componentState.selectedId !== "" && <RunsListSkeleton />}</>
        )}
      </div>
    </div>
  );
}

export default RunsListTag;
