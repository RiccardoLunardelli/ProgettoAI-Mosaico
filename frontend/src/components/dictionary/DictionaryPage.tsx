import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Modal } from "rsuite";
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
import type { DictionatyListInterface } from "../../stores/slices/Base/dictionaryListSlice";
import WarningTag from "../Warning/Warning";
import type { runIdTemplateInterface } from "../../stores/slices/Base/templateBaseListSlice";
import { RunPatchPreviewAPIHook } from "../../customHooks/API/ValidateOnly/ValidateOnlyAPI";

const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));
const DictionaryPatchFormTag = lazy(() => import("./DictionaryPatchForm"));
const BasicButtonGenericTag = lazy(
  () => import("../button/BasicButtonGeneric"),
);
const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

export type ModeType = "run_report" | "manual";

interface SuggestionRunInterface {
  patch: {};
  suggestions: {}[];
}

interface ComponentStateInterface {
  selectedId: string;
  selectedRunId: string;
  whatImDoing: WhatToDoType;
  Mode: ModeType;
  suggestRun: null | SuggestionRunInterface;
  showPreviewModal: boolean;
  previewResponse: string;
  previewPatchToSave: string;
  previewSaveValidateOnly: boolean;
}

const inputIdList = ["DictionaryDetails-Edit", "DictionaryPatch-TextArea"];

function DictionaryPageTag() {
  const dispatch = useDispatch();

  const [GetDictionatyIdsAPI] = GetDictionaryIdsAPIHook();
  const [GetDictionaryDetailAPI] = GetDictionaryDetailAPIHook();
  const [UpdateDictionaryDetailAPI] = UpdateDictionaryDetailAPIHook();
  const [RunReportDictionaryAPI] = RunReportDictionaryAPIHook();
  const [GetRunIdTemplateAPI] = GetRunIdTemplateAPIHook();
  const [RunPatchPreviewAPI] = RunPatchPreviewAPIHook();

  const dictionaryListSlice: {
    value: DictionatyListInterface[];
    detail: any;
  } = useSelector(
    (state: {
      dictionaryListSlice: { value: DictionatyListInterface[]; detail: any };
    }) => state.dictionaryListSlice,
  );

  const templateBaseListSlice: { runIdTemplate: runIdTemplateInterface[] } =
    useSelector(
      (state: {
        templateBaseListSlice: { runIdTemplate: runIdTemplateInterface[] };
      }) => state.templateBaseListSlice,
    );

  const inputSliceValue: {
    "DictionaryDetails-Edit": string;
    "DictionaryPatch-TextArea": string;
  } = useSelector((state: any) => {
    return Object.keys(state.inputSlice.value).reduce(
      (accumulator: any, currentValue: string) => {
        if (inputIdList.includes(currentValue)) {
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

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      whatImDoing: "PatchJson",
      Mode: "run_report",
      selectedRunId: "",
      suggestRun: null,
      showPreviewModal: false,
      previewResponse: "",
      previewPatchToSave: "",
      previewSaveValidateOnly: false,
    },
  );

  const selectedDictionary = useMemo(() => {
    return (dictionaryListSlice?.value ?? []).find(
      (item) => item.id === componentState.selectedId,
    );
  }, [dictionaryListSlice?.value, componentState.selectedId]);

  const isEditJsonValid = IsValidJSON(
    inputSliceValue["DictionaryDetails-Edit"] ?? "",
  );

  const isPatchJsonValid = IsValidJSON(
    inputSliceValue["DictionaryPatch-TextArea"] ?? "",
  );

  const isEditChanged =
    inputSliceValue["DictionaryDetails-Edit"] !==
    JSON.stringify(dictionaryListSlice.detail, null, 2);

  const canSaveEdit = isEditJsonValid && isEditChanged;

  const canSavePatch =
    (inputSliceValue["DictionaryPatch-TextArea"] ?? "").replaceAll(" ", "") !==
      "" && isPatchJsonValid;

  const resetDictionaryPatchInputs = () => {
    [
      "DictionaryPatch-operation",
      "DictionaryPatch-concept_id",
      "DictionaryPatch-value",
      "DictionaryPatch-category",
      "DictionaryPatch-semantic_category",
      "DictionaryPatch-synonyms_it",
      "DictionaryPatch-synonyms_en",
      "DictionaryPatch-abbreviations",
      "DictionaryPatch-lang",
      "DictionaryPatch-old_value",
      "DictionaryPatch-new_value",
      "DictionaryPatch-TextArea",
      "DictionaryPatch-Concepts-TextArea",
    ].forEach((singleId) => {
      dispatch(
        SetInputSlice({
          id: singleId,
          value: "",
        }),
      );
    });
  };

  const HandleSelectIdOnClick = (singleId: string) => {
    resetDictionaryPatchInputs();

    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      selectedId: singleId ?? "",
      selectedRunId: "",
      suggestRun: null,
      showPreviewModal: false,
      previewResponse: "",
      previewPatchToSave: "",
      previewSaveValidateOnly: false,
    }));
  };

  const HandleSelectRunIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      selectedRunId: singleId ?? "",
      suggestRun: null,
      showPreviewModal: false,
      previewResponse: "",
      previewPatchToSave: "",
      previewSaveValidateOnly: false,
    }));
  };

  const HandleSelectModeButtonOnClick = (mode: ModeType) => {
    if (!mode) return;

    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      Mode: mode,
      suggestRun: null,
      showPreviewModal: false,
      previewResponse: "",
      previewPatchToSave: "",
      previewSaveValidateOnly: false,
    }));
  };

  const HandleSelectWhatDoButtonOnClick = (whatToDo: WhatToDoType) => {
    if (!whatToDo) return;

    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      whatImDoing: whatToDo,
      suggestRun: null,
      showPreviewModal: false,
      previewResponse: "",
      previewPatchToSave: "",
      previewSaveValidateOnly: false,
    }));
  };

  const HandleSaveEditButtonOnClick = () => {
    if (!canSaveEdit) return;

    UpdateDictionaryDetailAPI({
      data: {
        id: componentState?.selectedId ?? "",
        dictionary_json: JSON.parse(inputSliceValue["DictionaryDetails-Edit"]),
      },
      showToast: true,
      showLoader: true,
      EndCallback: () => {
        GetDictionatyIdsAPI({ showLoader: true, saveResponse: true });
      },
    });
  };

  const HandlePreviewManualPatchButtonOnClick = () => {
    const patchValue = inputSliceValue["DictionaryPatch-TextArea"] ?? "";

    if (!componentState.selectedId || !canSavePatch) return;

    RunPatchPreviewAPI({
      data: {
        id: componentState.selectedId,
        artifact_type: "dictionary",
        patch_json: JSON.parse(patchValue),
      },
      showToast: false,
      showLoader: true,
      EndCallback: (result) => {
        let previewText = "";

        if (typeof result?.message === "string") {
          try {
            previewText = JSON.stringify(JSON.parse(result.message), null, 2);
          } catch {
            previewText = result.message;
          }
        } else {
          previewText = JSON.stringify(result?.message ?? {}, null, 2);
        }

        setComponentState((previousStateVal) => ({
          ...previousStateVal,
          showPreviewModal: true,
          previewResponse: previewText,
          previewPatchToSave: patchValue,
          previewSaveValidateOnly: false,
        }));
      },
    });
  };

  const HandleSaveManualPatchAfterPreviewButtonOnClick = () => {
    const patchToSave =
      componentState.previewPatchToSave ||
      inputSliceValue["DictionaryPatch-TextArea"] ||
      "";

    if (!componentState.selectedId || !patchToSave.trim()) return;

    RunReportDictionaryAPI({
      data: {
        id: componentState.selectedId,
        validate_only: componentState.previewSaveValidateOnly,
        mode: "manual",
        run_id: "",
        manual_mode: "patch",
        patch_json: JSON.parse(patchToSave),
      },
      showToast: true,
      showLoader: true,
      EndCallback: (result) => {
        GetDictionatyIdsAPI({ showLoader: true, saveResponse: true });

        let parsedMessage: any = {};
        try {
          parsedMessage = JSON.parse(result?.message ?? "{}");
        } catch {
          parsedMessage = {};
        }

        setComponentState((previousStateVal) => ({
          ...previousStateVal,
          suggestRun:
            parsedMessage?.patch && parsedMessage?.suggestions
              ? {
                  patch: parsedMessage.patch ?? {},
                  suggestions: parsedMessage.suggestions ?? [],
                }
              : previousStateVal.suggestRun,
          showPreviewModal: false,
          previewResponse: "",
          previewPatchToSave: "",
          previewSaveValidateOnly: false,
        }));
      },
    });
  };

  const HandleRunReportOrSaveButtonOnClick = () => {
    if (!componentState.selectedId) return;

    const isManualPatchMode =
      componentState.Mode === "manual" &&
      componentState.whatImDoing === "PatchJson";

    if (isManualPatchMode) {
      HandlePreviewManualPatchButtonOnClick();
      return;
    }

    if (componentState.Mode === "manual") {
      if (componentState.whatImDoing === "Edit") return;
      if (!canSavePatch) return;
      return;
    }

    if (componentState.Mode === "run_report") {
      if (!componentState.selectedRunId) return;

      RunReportDictionaryAPI({
        data: {
          id: componentState.selectedId,
          validate_only: false,
          mode: "run_report",
          run_id: componentState.selectedRunId,
          manual_mode: "",
          patch_json: {},
        },
        showToast: true,
        showLoader: true,
        EndCallback: (result) => {
          GetDictionatyIdsAPI({ showLoader: true, saveResponse: true });

          let parsedMessage: any = {};
          try {
            parsedMessage = JSON.parse(result?.message ?? "{}");
          } catch {
            parsedMessage = {};
          }

          if (parsedMessage?.patch && parsedMessage?.suggestions) {
            setComponentState((previousStateVal) => ({
              ...previousStateVal,
              suggestRun: {
                patch: parsedMessage.patch ?? {},
                suggestions: parsedMessage.suggestions ?? [],
              },
            }));
          }
        },
      });
    }
  };

  useEffect(() => {
    if (componentState.selectedId === "") return;

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

    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      suggestRun: null,
    }));
  }, []);

  useEffect(() => {
    if (componentState.Mode !== "run_report") return;
    GetRunIdTemplateAPI({ showLoader: true, saveResponse: true });
  }, [componentState.Mode]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
    padding: "18px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "12px",
  };

  const subtleTitleStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "8px",
  };

  const selectionItemStyle = (isSelected: boolean): React.CSSProperties => ({
    borderRadius: "10px",
    padding: "10px 12px",
    width: "100%",
    cursor: "pointer",
    fontSize: "13px",
    color: isSelected ? "#1d4ed8" : "#111827",
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: isSelected ? "#eff6ff" : "#f9fafb",
    border: isSelected ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
    transition: "all 0.15s ease",
    boxSizing: "border-box",
  });

  return (
    <>
      <div
        style={{
          backgroundColor: "#f9fafb",
          height: "100%",
          width: "100%",
          display: "flex",
          gap: "20px",
          padding: "20px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "36%",
            minWidth: "360px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflow: "hidden",
          }}
        >
          <div style={{ ...cardStyle, flexShrink: 0 }}>
            <div style={sectionTitleStyle}>Dictionary disponibili</div>

            <div
              style={{
                maxHeight: "320px",
                overflow: "auto",
                paddingRight: "4px",
              }}
            >
              {(dictionaryListSlice?.value ?? []).length > 0 ? (
                (dictionaryListSlice?.value ?? []).map(
                  (singleItem: DictionatyListInterface) => {
                    const isSelected =
                      componentState.selectedId === (singleItem?.id ?? "");

                    return (
                      <div
                        key={singleItem.id ?? ""}
                        className="HoverTransform"
                        style={selectionItemStyle(isSelected)}
                        onClick={() => HandleSelectIdOnClick(singleItem.id)}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: 600 }}>
                            {singleItem.name ?? "Senza nome"}
                          </span>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            ID: {singleItem.id ?? "-"}
                          </span>
                        </div>

                        {isSelected && (
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: "18px",
                              color: "#2563eb",
                              userSelect: "none",
                            }}
                          >
                            check_circle
                          </span>
                        )}
                      </div>
                    );
                  },
                )
              ) : (
                <span style={{ opacity: 0.6 }}>Nessun dictionary trovato</span>
              )}
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={sectionTitleStyle}>Preview dictionary</div>

            {componentState.selectedId !== "" ? (
              dictionaryListSlice.detail ? (
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "auto",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      textAlign: "left",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    {JSON.stringify(dictionaryListSlice.detail, null, 2)}
                  </pre>
                </div>
              ) : (
                <Suspense fallback="">
                  <RunsListSkeleton />
                </Suspense>
              )
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  border: "1px dashed #d1d5db",
                  color: "#6b7280",
                  backgroundColor: "#fcfcfd",
                }}
              >
                Seleziona un dictionary per vedere l’anteprima
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflow: "auto",
            paddingRight: "4px",
          }}
        >
          {componentState.selectedId ? (
            <>
              <div style={cardStyle}>
                <div style={subtleTitleStyle}>Dictionary selezionato</div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {selectedDictionary?.name ?? "Dictionary"}
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  ID: {componentState.selectedId}
                </div>

                <div style={{ marginTop: "12px" }}>
                  <WarningTag />
                </div>
              </div>

              <div style={cardStyle}>
                <div style={sectionTitleStyle}>Modalità operativa</div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <BasicButtonGenericTag
                    textToSee="Run Report"
                    style={{
                      color:
                        componentState.Mode === "run_report"
                          ? "white"
                          : undefined,
                      backgroundColor:
                        componentState.Mode === "run_report"
                          ? "#477dda"
                          : undefined,
                      fontWeight: 600,
                    }}
                    clickCallBack={() =>
                      HandleSelectModeButtonOnClick("run_report")
                    }
                  />

                  <BasicButtonGenericTag
                    textToSee="Manual"
                    style={{
                      color:
                        componentState.Mode === "manual" ? "white" : undefined,
                      backgroundColor:
                        componentState.Mode === "manual" ? "#477dda" : undefined,
                      fontWeight: 600,
                    }}
                    clickCallBack={() => HandleSelectModeButtonOnClick("manual")}
                  />
                </div>
              </div>

              {componentState.Mode === "manual" && (
                <div style={cardStyle}>
                  <div style={sectionTitleStyle}>Modalità manuale</div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "18px",
                    }}
                  >
                    <BasicButtonGenericTag
                      textToSee="Patch Json"
                      style={{
                        color:
                          componentState.whatImDoing === "PatchJson"
                            ? "white"
                            : undefined,
                        backgroundColor:
                          componentState.whatImDoing === "PatchJson"
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
                        color:
                          componentState.whatImDoing === "Edit"
                            ? "white"
                            : undefined,
                        backgroundColor:
                          componentState.whatImDoing === "Edit"
                            ? "#477dda"
                            : undefined,
                        fontWeight: 600,
                      }}
                      clickCallBack={() =>
                        HandleSelectWhatDoButtonOnClick("Edit")
                      }
                    />
                  </div>

                  {componentState.whatImDoing === "Edit" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      <div
                        style={{
                          borderRadius: "12px",
                          border: "1px solid #d1d5db",
                          overflow: "hidden",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <Suspense fallback="">
                          <MonacoEditorTag
                            height="420px"
                            defaultLanguage="json"
                            value={inputSliceValue["DictionaryDetails-Edit"] ?? ""}
                            onChange={(value) => {
                              dispatch(
                                SetInputSlice({
                                  id: "DictionaryDetails-Edit",
                                  value: value ?? "",
                                }),
                              );
                            }}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 13,
                              formatOnPaste: true,
                              formatOnType: true,
                              scrollBeyondLastLine: false,
                              wordWrap: "on",
                              automaticLayout: true,
                              tabSize: 2,
                            }}
                          />
                        </Suspense>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <BasicButtonGenericTag
                          textToSee="Salva modifiche"
                          disabledButton={!canSaveEdit}
                          clickCallBack={HandleSaveEditButtonOnClick}
                        />
                      </div>
                    </div>
                  )}

                  {componentState.whatImDoing === "PatchJson" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      <DictionaryPatchFormTag
                        inputPrefix="DictionaryPatch"
                        key={componentState.selectedId}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <BasicButtonGenericTag
                          textToSee="Apri preview"
                          disabledButton={!canSavePatch}
                          clickCallBack={HandleRunReportOrSaveButtonOnClick}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {componentState.Mode === "run_report" && (
                <>
                  <div style={cardStyle}>
                    <div style={sectionTitleStyle}>Selezione Run Id</div>

                    <div
                      style={{
                        maxHeight: "300px",
                        overflow: "auto",
                        paddingRight: "4px",
                      }}
                    >
                      {(templateBaseListSlice?.runIdTemplate ?? []).length > 0 ? (
                        (templateBaseListSlice?.runIdTemplate ?? []).map(
                          (singleId: runIdTemplateInterface) => {
                            const isSelected =
                              componentState.selectedRunId === singleId.id;

                            return (
                              <div
                                key={singleId.id ?? ""}
                                className="HoverTransform"
                                style={selectionItemStyle(isSelected)}
                                onClick={() =>
                                  HandleSelectRunIdOnClick(singleId.id)
                                }
                              >
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {singleId.id ?? ""}
                                </span>
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {singleId.template ?? ""}
                                </span>

                                {isSelected && (
                                  <span
                                    className="material-symbols-outlined"
                                    style={{
                                      fontSize: "18px",
                                      color: "#2563eb",
                                      userSelect: "none",
                                    }}
                                  >
                                    check_circle
                                  </span>
                                )}
                              </div>
                            );
                          },
                        )
                      ) : (
                        <div
                          style={{
                            backgroundColor: "#fff7ed",
                            border: "1px solid #fed7aa",
                            color: "#9a3412",
                            borderRadius: "10px",
                            padding: "12px",
                            fontSize: "13px",
                          }}
                        >
                          È necessario fare una run per il template prima di
                          poter generare suggerimenti e patch direttamente per
                          il dizionario.
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "16px",
                      }}
                    >
                      <BasicButtonGenericTag
                        textToSee="Genera suggerimenti e patch"
                        disabledButton={componentState.selectedRunId === ""}
                        clickCallBack={HandleRunReportOrSaveButtonOnClick}
                      />
                    </div>
                  </div>

                  {componentState.suggestRun != null && (
                    <div style={{ ...cardStyle, minHeight: "320px" }}>
                      <div style={sectionTitleStyle}>Risultato</div>

                      <div
                        style={{
                          backgroundColor: "#f3f4f6",
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                          padding: "14px",
                          maxHeight: "60vh",
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
                            lineHeight: "1.5",
                          }}
                        >
                          {JSON.stringify(componentState.suggestRun, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div
              style={{
                ...cardStyle,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                fontSize: "15px",
                textAlign: "center",
              }}
            >
              Seleziona un dictionary dalla lista a sinistra per iniziare
            </div>
          )}
        </div>
      </div>

      <Modal
        open={componentState.showPreviewModal}
        onClose={() => {
          setComponentState((previousStateVal) => ({
            ...previousStateVal,
            showPreviewModal: false,
          }));
        }}
        size="lg"
      >
        <Modal.Header>
          <Modal.Title>Preview patch dictionary</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "8px",
                }}
              >
                Salvataggio finale
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  fontWeight: 500,
                }}
              >
                Scegli se eseguire la chiamata finale in validate only oppure no
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  Validate Only
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Se attivo non sarà creata la nuova versione.
                </span>
              </div>

              <Suspense fallback="">
                <Toggle
                  checked={componentState.previewSaveValidateOnly}
                  onChange={(val: boolean) => {
                    setComponentState((previousStateVal) => ({
                      ...previousStateVal,
                      previewSaveValidateOnly: val,
                    }));
                  }}
                />
              </Suspense>
            </div>
          </div>

          <div
            style={{
              height: "60vh",
              minHeight: "420px",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            <Suspense
              fallback={
                <div style={{ padding: "16px" }}>Caricamento preview...</div>
              }
            >
              <MonacoEditorTag
                height="100%"
                defaultLanguage="json"
                value={componentState.previewResponse}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </Suspense>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            appearance="subtle"
            onClick={() => {
              setComponentState((previousStateVal) => ({
                ...previousStateVal,
                showPreviewModal: false,
              }));
            }}
          >
            Chiudi
          </Button>

          <Button
            appearance="primary"
            onClick={HandleSaveManualPatchAfterPreviewButtonOnClick}
          >
            Salva patch
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default DictionaryPageTag;