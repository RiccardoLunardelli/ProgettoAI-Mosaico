import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Modal } from "rsuite";

import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import { IsValidJSON } from "../../commons/commonsFunctions";
import {
  GetTemplateBaseDetailAPIHook,
  GetTemplateBaseIdsAPIHook,
  UpdateTemplateBaseDetailAPIHook,
  UpdateTemplateBasePatchAPIHook,
} from "../../customHooks/API/TemplateBase/templateBaseAPI";
import TemplateBasePatchFormTag from "./TemplateBasePatchForm";
import type { TemplateBaseListInterface } from "../../stores/slices/Base/templateBaseListSlice";
import { RunPatchPreviewAPIHook } from "../../customHooks/API/ValidateOnly/ValidateOnlyAPI";

const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));
const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);
const BasicButtonGenericTag = lazy(
  () => import("../button/BasicButtonGeneric"),
);
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

type WhatToDoType = "PatchJson" | "Edit";

interface ComponentStateInterface {
  selectedId: string;
  whatImDoing: WhatToDoType;
  showPreviewModal: boolean;
  previewResponse: string;
  previewValidatedPatch: string;
  previewSaveValidateOnly: boolean;
}

const inputIdList = ["TemplateBaseDetails-Edit", "TemplateBasePatch-TextArea"];

function TemplateBasePageTag() {
  const dispatch = useDispatch();

  const [GetTemplateBaseDetailAPI] = GetTemplateBaseDetailAPIHook();
  const [GetTemplateBaseIdsAPI] = GetTemplateBaseIdsAPIHook();
  const [UpdateTemplateBaseDetailAPI] = UpdateTemplateBaseDetailAPIHook();
  const [UpdateTemplateBasePatchAPI] = UpdateTemplateBasePatchAPIHook();
  const [RunPatchPreviewAPI] = RunPatchPreviewAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      whatImDoing: "PatchJson",
      showPreviewModal: false,
      previewResponse: "",
      previewValidatedPatch: "",
      previewSaveValidateOnly: false,
    },
  );

  const templateBaseListSlice: {
    value: TemplateBaseListInterface[];
    detail: any;
  } = useSelector(
    (state: {
      templateBaseListSlice: {
        value: TemplateBaseListInterface[];
        detail: any;
      };
    }) => state.templateBaseListSlice,
  );

  const inputSliceValue: {
    "TemplateBaseDetails-Edit": string;
    "TemplateBasePatch-TextArea": string;
  } = useSelector((state: any) => {
    return Object.keys(state.inputSlice.value).reduce(
      (accumulator: any, currentValue: string) => {
        if (inputIdList.includes(currentValue)) {
          accumulator[currentValue] = state.inputSlice.value[currentValue];
        }

        return accumulator;
      },
      {
        "TemplateBaseDetails-Edit": "",
        "TemplateBasePatch-TextArea": "",
      },
    );
  });

  const selectedTemplateBase = useMemo(() => {
    return (templateBaseListSlice?.value ?? []).find(
      (item) => item.id === componentState.selectedId,
    );
  }, [templateBaseListSlice?.value, componentState.selectedId]);

  const isEditJsonValid = IsValidJSON(
    inputSliceValue["TemplateBaseDetails-Edit"] ?? "",
  );

  const isPatchJsonValid = IsValidJSON(
    inputSliceValue["TemplateBasePatch-TextArea"] ?? "",
  );

  const isEditChanged =
    inputSliceValue["TemplateBaseDetails-Edit"] !==
    JSON.stringify(templateBaseListSlice.detail, null, 2);

  const canSaveEdit = isEditJsonValid && isEditChanged;

  const canSavePatch =
    (inputSliceValue["TemplateBasePatch-TextArea"] ?? "").trim() !== "" &&
    isPatchJsonValid;

  const resetTemplateBasePatchInputs = () => {
    [
      "TemplateBasePatch-operation",
      "TemplateBasePatch-category_id",
      "TemplateBasePatch-concept_id",
      "TemplateBasePatch-semantic_category",
      "TemplateBasePatch-label_it",
      "TemplateBasePatch-label_en",
      "TemplateBasePatch-description",
      "TemplateBasePatch-category",
      "TemplateBasePatch-TextArea",
      "TemplateBasePatch-Concepts-TextArea",
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
    resetTemplateBasePatchInputs();

    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      selectedId: singleId ?? "",
      showPreviewModal: false,
      previewResponse: "",
      previewValidatedPatch: "",
      previewSaveValidateOnly: false,
    }));
  };

  const HandleSelectWhatDoButtonOnClick = (whatToDo: WhatToDoType) => {
    if (!whatToDo) return;

    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      whatImDoing: whatToDo,
      showPreviewModal: false,
      previewResponse: "",
      previewValidatedPatch: "",
      previewSaveValidateOnly: false,
    }));
  };

  const HandleSaveEditButtonOnClick = () => {
    if (!canSaveEdit) return;

    UpdateTemplateBaseDetailAPI({
      data: {
        id: componentState.selectedId ?? "",
        template_base_json: JSON.parse(
          inputSliceValue["TemplateBaseDetails-Edit"],
        ),
      },
      showToast: true,
      showLoader: true,
      EndCallback: () => {
        GetTemplateBaseIdsAPI({ showLoader: true, saveResponse: true });
      },
    });
  };

  const HandlePreviewPatchButtonOnClick = () => {
    const patchValue = inputSliceValue["TemplateBasePatch-TextArea"] ?? "";

    if (!canSavePatch || !componentState.selectedId) return;

    RunPatchPreviewAPI({
      data: {
        id: componentState.selectedId,
        artifact_type: "template_base",
        patch_json: JSON.parse(patchValue),
      },
      showToast: false,
      showLoader: true,
      EndCallback: (returnValue) => {
        let previewText = "";

        if (typeof returnValue?.message === "string") {
          try {
            previewText = JSON.stringify(
              JSON.parse(returnValue.message),
              null,
              2,
            );
          } catch {
            previewText = returnValue.message;
          }
        } else {
          previewText = JSON.stringify(returnValue?.message ?? {}, null, 2);
        }

        setComponentState((previousStateVal) => ({
          ...previousStateVal,
          showPreviewModal: true,
          previewResponse: previewText,
          previewValidatedPatch: patchValue,
          previewSaveValidateOnly: false,
        }));
      },
    });
  };

  const HandleSavePatchButtonOnClick = () => {
    const patchToSave =
      componentState.previewValidatedPatch ||
      inputSliceValue["TemplateBasePatch-TextArea"] ||
      "";

    if (!patchToSave.trim() || !componentState.selectedId) return;

    UpdateTemplateBasePatchAPI({
      data: {
        id: componentState.selectedId,
        validate_only: componentState.previewSaveValidateOnly,
        patch_json: JSON.parse(patchToSave),
      },
      showToast: true,
      showLoader: true,
      EndCallback: () => {
        setComponentState((previousStateVal) => ({
          ...previousStateVal,
          showPreviewModal: false,
          previewResponse: "",
          previewValidatedPatch: "",
          previewSaveValidateOnly: false,
        }));

        GetTemplateBaseIdsAPI({ showLoader: true, saveResponse: true });
      },
    });
  };

  useEffect(() => {
    GetTemplateBaseIdsAPI({ showLoader: true, saveResponse: true });
  }, []);

  useEffect(() => {
    if (componentState.selectedId === "") return;

    GetTemplateBaseDetailAPI({
      data: { id: componentState.selectedId },
      showLoader: true,
      saveResponse: true,
      EndCallback(returnValue) {
        dispatch(
          SetInputSlice({
            id: "TemplateBaseDetails-Edit",
            value: JSON.stringify(returnValue?.message, null, 2),
          }),
        );
      },
    });
  }, [componentState.selectedId]);

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
            <div style={sectionTitleStyle}>Template Base</div>

            <div
              style={{
                maxHeight: "320px",
                overflow: "auto",
                paddingRight: "4px",
              }}
            >
              {(templateBaseListSlice?.value ?? []).length > 0 ? (
                (templateBaseListSlice?.value ?? []).map(
                  (singleItem: TemplateBaseListInterface) => {
                    const isSelected =
                      componentState.selectedId === (singleItem?.id ?? "");

                    return (
                      <div
                        key={singleItem?.id ?? ""}
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
                            {singleItem?.name ?? "Senza nome"}
                          </span>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            ID: {singleItem?.id ?? "-"}
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
                <span style={{ opacity: 0.6 }}>Nessun template trovato</span>
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
            <div style={sectionTitleStyle}>Preview template base</div>

            {componentState.selectedId !== "" ? (
              templateBaseListSlice.detail ? (
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
                    {JSON.stringify(templateBaseListSlice.detail, null, 2)}
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
                Seleziona un template base per vedere l’anteprima
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
                <div style={subtleTitleStyle}>Elemento selezionato</div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {selectedTemplateBase?.name ?? "Template Base"}
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
              </div>

              <div style={cardStyle}>
                <div style={sectionTitleStyle}>Operazione</div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                    clickCallBack={() => HandleSelectWhatDoButtonOnClick("Edit")}
                  />
                </div>
              </div>

              {componentState.whatImDoing === "Edit" && (
                <div style={cardStyle}>
                  <div style={sectionTitleStyle}>Modifica JSON</div>

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
                        height="520px"
                        defaultLanguage="json"
                        value={inputSliceValue["TemplateBaseDetails-Edit"] ?? ""}
                        onChange={(value) => {
                          dispatch(
                            SetInputSlice({
                              id: "TemplateBaseDetails-Edit",
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
                          tabSize: 2,
                          automaticLayout: true,
                          readOnly: false,
                        }}
                      />
                    </Suspense>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "14px",
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
                <div style={cardStyle}>
                  <div style={sectionTitleStyle}>Patch JSON</div>

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
                      <div style={subtleTitleStyle}>Modalità patch</div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        Apri preview e poi scegli dal modal se salvare in
                        validate only oppure no
                      </div>
                    </div>
                  </div>

                  <div>
                    <TemplateBasePatchFormTag
                      inputPrefix="TemplateBasePatch"
                      key={componentState.selectedId}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "14px",
                    }}
                  >
                    <BasicButtonGenericTag
                      textToSee="Apri preview"
                      disabledButton={!canSavePatch}
                      clickCallBack={HandlePreviewPatchButtonOnClick}
                    />
                  </div>
                </div>
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
              Seleziona un template base dalla lista a sinistra per iniziare
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
          <Modal.Title>Preview patch template base</Modal.Title>
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

          <Button appearance="primary" onClick={HandleSavePatchButtonOnClick}>
            Salva patch
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TemplateBasePageTag;