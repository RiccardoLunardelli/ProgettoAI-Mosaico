import { lazy, Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import { IsValidJSON } from "../../commons/commonsFunctions";
import { GetKnowledgeBaseDetailAPIHook, GetKnowledgeBaseIdsAPIHook, UpdateKnowledgeBaseDetailAPIHook, UpdateKnowledgeBasePatchAPIHook } from "../../customHooks/API/KnowledgeBase/knowledgeBaseAPI";

const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));
const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);
const TextareaTag = lazy(() => import("rsuite/esm/Textarea"));
const BasicButtonGenericTag = lazy(
  () => import("../button/BasicButtonGeneric"),
);

export type WhatToDoType = "PatchJson" | "Edit";

interface ComponentStateInterface {
  selectedId: string;
  validateOnly: boolean;
  whatImDoing: WhatToDoType;
}

//Usata per prendersi i valori nello Slice degli input
const inputIdList = [
  "KnowledgeBaseDetails-Edit",
  "KnowledgeBasePatch-TextArea",
];

function KnowledgeBasePageTag() {
  const [GetKnowledgeBaseDetailAPI] = GetKnowledgeBaseDetailAPIHook();
  const [GetKnowledgeBaseIdsAPI] = GetKnowledgeBaseIdsAPIHook();
  const [UpdateKnowledgeBaseDetailAPI] = UpdateKnowledgeBaseDetailAPIHook();
  const [UpdateKnowledgeBasePatchAPI] = UpdateKnowledgeBasePatchAPIHook();
  const dispatch = useDispatch();
  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      validateOnly: false,
      whatImDoing: "PatchJson",
    },
  );

  const knowledgeBaseListSlice: { value: string[]; detail: string } =
    useSelector(
      (state: {
        knowledgeBaseListSlice: { value: string[]; detail: string };
      }) => state.knowledgeBaseListSlice,
    );

  const inputSliceValue: {
    "KnowledgeBaseDetails-Edit": string;
    "KnowledgeBasePatch-TextArea": string;
  } = useSelector((state: any) => {
    //Per ogni chiave dello Slice degli input
    return Object.keys(state.inputSlice.value).reduce(
      function (accumulator: any, currentValue: any) {
        //Controllo se questa chiave mi serve
        if (inputIdList.includes(currentValue)) {
          //Se passa tutti i controlli, salvo il valore
          accumulator[currentValue] = state.inputSlice.value[currentValue];
        }
        return accumulator;
      },
      {
        "KnowledgeBaseDetails-Edit": "",
        "KnowledgeBasePatch-TextArea": "",
      },
    );
  });

  const HandleSelectIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedId: singleId ?? "",
      };
    });
  };

  const HandleSelectWhatDoButtonOnClick = (whatToDo: WhatToDoType) => {
    if (!whatToDo) return;

    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        whatImDoing: whatToDo,
      };
    });
  };

  const HandleSaveEditButtonOnClick = () => {
    UpdateKnowledgeBaseDetailAPI({
      data: {
        kb_name: componentState?.selectedId ?? "",
        kb_json: JSON.parse(inputSliceValue["KnowledgeBaseDetails-Edit"]),
      },
      showToast: true,
      showLoader: true,
      EndCallback: () => {
        GetKnowledgeBaseIdsAPI({ showLoader: true, saveResponse: true });
      },
    });
  };

  const HandleSavePatchButtonOnClick = () => {
    UpdateKnowledgeBasePatchAPI({
      data: {
        kb_name: componentState?.selectedId ?? "",
        validate_only: componentState.validateOnly,
        patch_json: JSON.parse(inputSliceValue["KnowledgeBasePatch-TextArea"]),
      },
      showToast: true,
      showLoader: true,
      EndCallback: () => {
        GetKnowledgeBaseIdsAPI({ showLoader: true, saveResponse: true });
      },
    });
  };

  useEffect(() => {
    GetKnowledgeBaseIdsAPI({ showLoader: true, saveResponse: true });
  }, []);

  useEffect(() => {
    if (componentState.selectedId == "") return;
    GetKnowledgeBaseDetailAPI({
      data: { id: componentState.selectedId },
      showLoader: true,
      saveResponse: true,
      EndCallback(returnValue) {
        dispatch(
          SetInputSlice({
            id: "KnowledgeBaseDetails-Edit",
            value: JSON.stringify(returnValue?.message, null, 2),
          }),
        );
      },
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
          overflow: "auto",
        }}
      >
        {/* Se non è selezionato un Id la pagina destra non si vede */}
        {componentState.selectedId ? (
          <>
            {/* Pulsante cosa fare */}
            <div style={{ margin: "20px" }}>
              <BasicButtonGenericTag
                textToSee="Patch Json"
                style={{
                  marginLeft: "10px",
                  color:
                    componentState.whatImDoing == "PatchJson"
                      ? "white"
                      : undefined,
                  backgroundColor:
                    componentState.whatImDoing == "PatchJson"
                      ? "#477dda"
                      : undefined,
                  fontWeight: 600,
                }}
                clickCallBack={() =>
                  HandleSelectWhatDoButtonOnClick("PatchJson")
                }
              />
              <BasicButtonGenericTag
                textToSee="Edit"
                style={{
                  marginLeft: "10px",
                  color:
                    componentState.whatImDoing == "Edit" ? "white" : undefined,
                  backgroundColor:
                    componentState.whatImDoing == "Edit"
                      ? "#477dda"
                      : undefined,
                  fontWeight: 600,
                }}
                clickCallBack={() => HandleSelectWhatDoButtonOnClick("Edit")}
              />
            </div>
            {/* Se whatImDoing è Edit */}
            {componentState.whatImDoing == "Edit" ? (
              <>
                <div>
                  <Suspense fallback="">
                    <TextareaTag
                      minHeight="300px"
                      minWidth="600px"
                      value={inputSliceValue["KnowledgeBaseDetails-Edit"] ?? ""}
                      onChange={(e: any) => {
                        dispatch(
                          SetInputSlice({
                            id: "KnowledgeBaseDetails-Edit",
                            value: e,
                          }),
                        );
                      }}
                    />
                  </Suspense>
                </div>
                <BasicButtonGenericTag
                  textToSee="Salva"
                  disabledButton={
                    inputSliceValue["KnowledgeBaseDetails-Edit"] ===
                      JSON.stringify(knowledgeBaseListSlice.detail, null, 2) ||
                    !IsValidJSON(inputSliceValue["KnowledgeBaseDetails-Edit"])
                  }
                  clickCallBack={HandleSaveEditButtonOnClick}
                />
              </>
            ) : (
              <></>
            )}
            {componentState.whatImDoing == "PatchJson" ? (
              <>
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
                    }}
                  >
                    Validate Only
                  </span>
                  <Toggle
                    checked={componentState?.validateOnly ?? false}
                    onChange={(val: boolean) => {
                      setComponentState(
                        (previousStateVal: ComponentStateInterface) => {
                          return {
                            ...previousStateVal,
                            validateOnly: val,
                          };
                        },
                      );
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
                      <span
                        style={{
                          fontSize: "13px",
                          opacity: "0.8",
                          marginLeft: "10px",
                        }}
                      >
                        Modalità Validate Only attiva — Nessuna modifica verrà
                        salvata
                      </span>
                    </div>
                  </>
                ) : (
                  <></>
                )}
                <div>
                  <Suspense fallback="">
                    <TextareaTag
                      minHeight="300px"
                      minWidth="600px"
                      marginTop={"20px"}
                      value={
                        inputSliceValue["KnowledgeBasePatch-TextArea"] ?? ""
                      }
                      onChange={(e: any) => {
                        dispatch(
                          SetInputSlice({
                            id: "KnowledgeBasePatch-TextArea",
                            value: e,
                          }),
                        );
                      }}
                    />
                  </Suspense>
                </div>
                <BasicButtonGenericTag
                  textToSee="Salva"
                  disabledButton={
                    inputSliceValue["KnowledgeBasePatch-TextArea"].replaceAll(
                      " ",
                      "",
                    ) == "" ||
                    !IsValidJSON(inputSliceValue["KnowledgeBasePatch-TextArea"])
                  }
                  clickCallBack={HandleSavePatchButtonOnClick}
                />
              </>
            ) : (
              <></>
            )}
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default KnowledgeBasePageTag;
