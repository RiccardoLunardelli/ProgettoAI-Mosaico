import { lazy, Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  GetKnoledgeBaseIdsAPIHook,
  GetKnowledgeBaseDetailAPIHook,
} from "../../customHooks/API/KnoledgeBase/knowledgeBaseAPI";

const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));
const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);

interface ComponentStateInterface {
  selectedId: string;
  validateOnly: boolean;
}

function KnowledgeBasePageTag() {
  const [GetKnowledgeBaseDetailAPI] = GetKnowledgeBaseDetailAPIHook();
  const [GetKnoledgeBaseIdsAPI] = GetKnoledgeBaseIdsAPIHook();
  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      validateOnly: false,
    },
  );

  const knowledgeBaseListSlice: { value: string[]; detail: string } =
    useSelector(
      (state: {
        knowledgeBaseListSlice: { value: string[]; detail: string };
      }) => state.knowledgeBaseListSlice,
    );

  const HandleSelectIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedId: singleId ?? "",
      };
    });
  };

  useEffect(() => {
    GetKnoledgeBaseIdsAPI({ showLoader: true, saveResponse: true });
  }, []);

  useEffect(() => {
    if (componentState.selectedId == "") return;
    GetKnowledgeBaseDetailAPI({
      data: { id: componentState.selectedId },
      showLoader: true,
      saveResponse: true,
    });
  }, [componentState.selectedId]);

  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {/* Parte Sinistra pagina divista */}
      <div
        style={{
          height: "100%",
          width: "50%",
          borderRight: "1px solid #e5e7eb",
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
              <span style={{ fontSize: "20px", fontWeight: 600 }}>
                Knowledge Base
              </span>

              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                  marginTop: "10px",
                }}
              >
                {(knowledgeBaseListSlice?.value ?? []).length > 0 ? (
                  <>
                    {(knowledgeBaseListSlice?.value ?? []).map(
                      (singleId: string) => {
                        const isSelected =
                          componentState.selectedId === singleId;

                        return (
                          <div
                            key={singleId ?? ""}
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
                              HandleSelectIdOnClick(singleId);
                            }}
                          >
                            <span style={{ fontSize: "14px", fontWeight: 500 }}>
                              {singleId ?? ""}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </>
                ) : (
                  <span style={{ opacity: "60%" }}>Nessuna run trovata</span>
                )}
              </div>
            </div>
          </div>

          {/* Card */}
          {knowledgeBaseListSlice.detail && componentState.selectedId !== "" ? (
            <>
              <div
                style={{ marginTop: "20px", display: "flex", opacity: "50%" }}
              >
                Preview run
              </div>
              <div
                style={{
                  backgroundColor: "#f3f5f7",
                  borderRadius: "8px",
                  padding: "10px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  boxSizing: "border-box",
                  width: "80%",
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
                  {JSON.stringify(knowledgeBaseListSlice.detail, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <>
              {componentState.selectedId !== "" && (
                <Suspense fallback="">
                  <RunsListSkeleton />
                </Suspense>
              )}
            </>
          )}
        </div>
      </div>
      {/* Parte Destra pagina divista */}
      <div
        style={{
          height: "100%",
          width: "50%",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {/* Toggle validate Only */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            style={{
              marginBottom: "4px",
              fontWeight: 500,
              fontSize: "15px",
              marginTop: "30px",
            }}
          >
            Validate Only
          </span>
          <Toggle
            checked={componentState?.validateOnly ?? false}
            onChange={(val: boolean) => {
              setComponentState((previousStateVal: ComponentStateInterface) => {
                return {
                  ...previousStateVal,
                  validateOnly: val,
                };
              });
            }}
          />
        </div>
        {/* Se Validate Only è abilitato */}
        {componentState.validateOnly ? (
          <>
            <div
              style={{
                backgroundColor: "#fff9e6",
                width: "95%",
                height: "5%",
                marginTop: "10px",
                borderRadius: "8px",
                border: "1px solid #f5dead",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  marginLeft: "20px",
                  opacity: "0.4",
                  userSelect: "none",
                }}
                className="material-symbols-outlined"
              >
                warning
              </span>
              <span style={{fontSize: "13px", opacity: "0.8", marginLeft: "10px"}}>
                Modalità Validate Only attiva — Nessuna modifica verrà salvata
              </span>
            </div>
          </>
        ) : (
          <></>
        )}

        { /* Text Area */ }
        <div>

        </div>
      </div>
    </div>
  );
}

export default KnowledgeBasePageTag;
