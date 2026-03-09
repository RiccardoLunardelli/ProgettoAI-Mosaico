import { lazy, Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { WhatToDoType } from "../knowledgebase/KnowledgeBasePage";
import {
  GetDictionaryDetailAPIHook,
  GetDictionaryIdsAPIHook,
  RunReportDictionaryAPIHook,
  UpdateDictionaryDetailAPIHook,
} from "../../customHooks/API/Dictionary/DictionaryAPI";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import { IsValidJSON } from "../../commons/commonsFunctions";
import { GetRunIdTemplateAPIHook } from "../../customHooks/API/TemplateBase/templateBaseAPI";

const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));

const BasicButtonGenericTag = lazy(
  () => import("../button/BasicButtonGeneric"),
);

const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);
const TextareaTag = lazy(() => import("rsuite/esm/Textarea"));

export type ModeType = "run_report" | "manual";

interface suggestionRunInterface {
  patch: {};
  suggestions: {}[];
}

interface ComponentStateInterface {
  selectedId: string;
  selectedRunId: string;
  validateOnly: boolean;
  whatImDoing: WhatToDoType;
  Mode: ModeType;
  suggestRun: null | suggestionRunInterface;
}

//Usata per prendersi i valori nello Slice degli input
const inputIdList = ["DictionaryDetails-Edit", "DictionaryPatch-TextArea"];

function DictionaryPageTag() {
  const [GetDictionatyIdsAPI] = GetDictionaryIdsAPIHook();
  const [GetDictionaryDetailAPI] = GetDictionaryDetailAPIHook();
  const [UpdateDictionaryDetailAPI] = UpdateDictionaryDetailAPIHook();
  const [RunReportDictionaryAPI] = RunReportDictionaryAPIHook();
  const [GetRunIdTemplateAPI] = GetRunIdTemplateAPIHook();

  const dispatch = useDispatch();

  const dictionaryListSlice: { value: string[]; detail: string } = useSelector(
    (state: { dictionaryListSlice: { value: string[]; detail: string } }) =>
      state.dictionaryListSlice,
  );

  const templateBaseListSlice: { runIdTemplate: string[] } = useSelector(
    (state: { templateBaseListSlice: { runIdTemplate: string[] } }) =>
      state.templateBaseListSlice,
  );

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      validateOnly: false,
      whatImDoing: "PatchJson",
      Mode: "run_report",
      selectedRunId: "",
      suggestRun: null,
    },
  );

  const inputSliceValue: {
    "DictionaryDetails-Edit": string;
    "DictionaryPatch-TextArea": string;
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
        "DictionaryDetails-Edit": "",
        "DictionaryPatch-TextArea": "",
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

  const HandleSelectRunIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedRunId: singleId ?? "",
      };
    });
  };

  const HandleSelectModeButtonOnClick = (mode: ModeType) => {
    if (!mode) return;

    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        Mode: mode,
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
    UpdateDictionaryDetailAPI({
      data: {
        dictionary_name: componentState?.selectedId ?? "",
        dictionary_json: JSON.parse(inputSliceValue["DictionaryDetails-Edit"]),
      },
      showToast: true,
      showLoader: true,
      EndCallback: () => {
        GetDictionatyIdsAPI({ showLoader: true, saveResponse: true });
      },
    });
  };

  const HandleSaveButtonOnClick = () => {
    RunReportDictionaryAPI({
      data: {
        dictionary_name: componentState?.selectedId ?? "",
        validate_only: componentState.validateOnly,
        mode: componentState.Mode,
        run_id:
          componentState.Mode == "manual" ? "" : componentState.selectedRunId,
        manual_mode: componentState.Mode == "manual" ? "patch" : "",
        patch_json:
          (componentState.whatImDoing == "PatchJson" && componentState.Mode == "manual") 
            ? JSON.parse(inputSliceValue["DictionaryPatch-TextArea"])
            : {},
      },
      showToast: true,
      showLoader: true,
      EndCallback: (result) => {
        GetDictionatyIdsAPI({ showLoader: true, saveResponse: true });

        const parsedMessage = JSON.parse(result?.message);

        if (parsedMessage?.patch && parsedMessage?.suggestions) {
          setComponentState((previousStateVal: ComponentStateInterface) => {
            return {
              ...previousStateVal,
              suggestRun: {
                patch: parsedMessage?.patch ?? {},
                suggestions: parsedMessage?.suggestions ?? [],
              },
            };
          });
        }
      },
    });
  };

  useEffect(() => {
    if (componentState.selectedId == "") return;
    GetDictionaryDetailAPI({
      data: { id: componentState.selectedId },
      showLoader: true,
      saveResponse: true,
      EndCallback(returnValue) {
        dispatch(
          SetInputSlice({
            id: "DictionaryDetails-Edit",
            value: JSON.stringify(returnValue?.message, null, 2),
          }),
        );
      },
    });
  }, [componentState.selectedId]);

  useEffect(() => {
    GetDictionatyIdsAPI({ showLoader: true, saveResponse: true });
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        suggestRun: null,
      };
    });
  }, []);

  useEffect(() => {
    if (componentState.Mode !== "run_report") return;
    GetRunIdTemplateAPI({ showLoader: true, saveResponse: true });
  }, [componentState.Mode]);

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
                Dictionary disponibili
              </span>

              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                  marginTop: "10px",
                }}
              >
                {(dictionaryListSlice?.value ?? []).length > 0 ? (
                  <>
                    {(dictionaryListSlice?.value ?? []).map(
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
          {dictionaryListSlice.detail && componentState.selectedId !== "" ? (
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
                  {JSON.stringify(dictionaryListSlice.detail, null, 2)}
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
        {/* Se non è selezionato un ID la parte destra della pagina non renderizza */}
        {componentState.selectedId ? (
          <>
            {/* Toggle validate Only */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "20px",
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
            {/* Pulsante cosa fare */}
            <div style={{ margin: "20px" }}>
              <BasicButtonGenericTag
                textToSee="Run Report"
                style={{
                  marginLeft: "10px",
                  color:
                    componentState.Mode == "run_report" ? "white" : undefined,
                  backgroundColor:
                    componentState.Mode == "run_report" ? "#477dda" : undefined,
                  fontWeight: 600,
                }}
                clickCallBack={() =>
                  HandleSelectModeButtonOnClick("run_report")
                }
              />
              <BasicButtonGenericTag
                textToSee="Manual"
                style={{
                  marginLeft: "10px",
                  color: componentState.Mode == "manual" ? "white" : undefined,
                  backgroundColor:
                    componentState.Mode == "manual" ? "#477dda" : undefined,
                  fontWeight: 600,
                }}
                clickCallBack={() => HandleSelectModeButtonOnClick("manual")}
              />
            </div>

            {/* Se è selezionata la manual mode */}
            {componentState.Mode == "manual" ? (
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
                        componentState.whatImDoing == "Edit"
                          ? "white"
                          : undefined,
                      backgroundColor:
                        componentState.whatImDoing == "Edit"
                          ? "#477dda"
                          : undefined,
                      fontWeight: 600,
                    }}
                    clickCallBack={() =>
                      HandleSelectWhatDoButtonOnClick("Edit")
                    }
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
                          value={
                            inputSliceValue["DictionaryDetails-Edit"] ?? ""
                          }
                          onChange={(e: any) => {
                            dispatch(
                              SetInputSlice({
                                id: "DictionaryDetails-Edit",
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
                        inputSliceValue["DictionaryDetails-Edit"] ===
                          JSON.stringify(dictionaryListSlice.detail, null, 2) ||
                        !IsValidJSON(inputSliceValue["DictionaryDetails-Edit"])
                      }
                      clickCallBack={HandleSaveEditButtonOnClick}
                    />
                  </>
                ) : (
                  <></>
                )}
                {componentState.whatImDoing == "PatchJson" ? (
                  <>
                    <div>
                      <Suspense fallback="">
                        <TextareaTag
                          minHeight="300px"
                          minWidth="600px"
                          marginTop={"20px"}
                          value={
                            inputSliceValue["DictionaryPatch-TextArea"] ?? ""
                          }
                          onChange={(e: any) => {
                            dispatch(
                              SetInputSlice({
                                id: "DictionaryPatch-TextArea",
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
                        inputSliceValue["DictionaryPatch-TextArea"].replaceAll(
                          " ",
                          "",
                        ) == "" ||
                        !IsValidJSON(
                          inputSliceValue["DictionaryPatch-TextArea"],
                        )
                      }
                      clickCallBack={HandleSaveButtonOnClick}
                    />
                  </>
                ) : (
                  <></>
                )}
              </>
            ) : (
              <></>
            )}
            {/* Se è selezionata run_report */}
            {componentState.Mode == "run_report" ? (
              <>
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
                      Seleziona un Run Id
                    </span>

                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        overflow: "auto",
                        marginTop: "10px",
                      }}
                    >
                      {(templateBaseListSlice?.runIdTemplate ?? []).length >
                      0 ? (
                        <>
                          {(templateBaseListSlice?.runIdTemplate ?? []).map(
                            (singleId: string) => {
                              const isSelected =
                                componentState.selectedRunId === singleId;

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
                                    HandleSelectRunIdOnClick(singleId);
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {singleId ?? ""}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </>
                      ) : (
                        <span style={{ opacity: "60%" }}>
                          Nessuna Run Id trovato
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <BasicButtonGenericTag
                  textToSee="Genera suggerimenti e patch"
                  disabledButton={componentState.selectedRunId == ""}
                  clickCallBack={HandleSaveButtonOnClick}
                  style={{ marginTop: "10px" }}
                />
                {/* Se riceve una risposta */}
                {componentState.suggestRun != null ? (
                  <>
                    <div
                      style={{
                        marginTop: "20px",
                        display: "flex",
                        opacity: "50%",
                        marginBottom: "5px"
                      }}
                    >
                      Risultato
                    </div>
                    <div
                      style={{
                        backgroundColor: "#f3f5f7",
                        borderRadius: "8px",
                        padding: "10px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        boxSizing: "border-box",
                        width: "80%",
                        height: "60vh",
                        display: "flex",
                        justifyContent: "flex-start",
                        overflow: "auto",
                        marginBottom: "10px"
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
                        {JSON.stringify(componentState.suggestRun, null, 2)}
                      </pre>
                    </div>
                  </>
                ) : (
                  <></>
                )}
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

export default DictionaryPageTag;
