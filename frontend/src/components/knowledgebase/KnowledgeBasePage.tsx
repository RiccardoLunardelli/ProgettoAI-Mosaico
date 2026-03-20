import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import { IsValidJSON } from "../../commons/commonsFunctions";
import {
  GetKnowledgeBaseDetailAPIHook,
  GetKnowledgeBaseIdsAPIHook,
  UpdateKnowledgeBaseDetailAPIHook,
  UpdateKnowledgeBasePatchAPIHook,
} from "../../customHooks/API/KnowledgeBase/knowledgeBaseAPI";

import KnowledgeBasePatchFormTag from "./KnowledgeBasePatchForm";
import type { KnowledgeBaseListInterface } from "../../stores/slices/Base/knowledgeBaseListSlice";

const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));
const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);
const BasicButtonGenericTag = lazy(
  () => import("../button/BasicButtonGeneric"),
);
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

export type WhatToDoType = "PatchJson" | "Edit";

interface ComponentStateInterface {
  selectedId: string;
  validateOnly: boolean;
  whatImDoing: WhatToDoType;
}

const inputIdList = [
  "KnowledgeBaseDetails-Edit",
  "KnowledgeBasePatch-TextArea",
];

function KnowledgeBasePageTag() {
  const dispatch = useDispatch();

  const [GetKnowledgeBaseDetailAPI] = GetKnowledgeBaseDetailAPIHook();
  const [GetKnowledgeBaseIdsAPI] = GetKnowledgeBaseIdsAPIHook();
  const [UpdateKnowledgeBaseDetailAPI] = UpdateKnowledgeBaseDetailAPIHook();
  const [UpdateKnowledgeBasePatchAPI] = UpdateKnowledgeBasePatchAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      validateOnly: false,
      whatImDoing: "PatchJson",
    },
  );

  const knowledgeBaseListSlice: {
    value: KnowledgeBaseListInterface[];
    detail: any;
  } = useSelector(
    (state: {
      knowledgeBaseListSlice: {
        value: KnowledgeBaseListInterface[];
        detail: any;
      };
    }) => state.knowledgeBaseListSlice,
  );

  const inputSliceValue: {
    "KnowledgeBaseDetails-Edit": string;
    "KnowledgeBasePatch-TextArea": string;
  } = useSelector((state: any) => {
    return Object.keys(state.inputSlice.value).reduce(
      (accumulator: any, currentValue: string) => {
        if (inputIdList.includes(currentValue)) {
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

  const selectedKnowledgeBase = useMemo(() => {
    return (knowledgeBaseListSlice?.value ?? []).find(
      (item) => item.id === componentState.selectedId,
    );
  }, [knowledgeBaseListSlice?.value, componentState.selectedId]);

  const isEditJsonValid = IsValidJSON(
    inputSliceValue["KnowledgeBaseDetails-Edit"] ?? "",
  );

  const isPatchJsonValid = IsValidJSON(
    inputSliceValue["KnowledgeBasePatch-TextArea"] ?? "",
  );

  const isEditChanged =
    inputSliceValue["KnowledgeBaseDetails-Edit"] !==
    JSON.stringify(knowledgeBaseListSlice.detail, null, 2);

  const canSaveEdit = isEditJsonValid && isEditChanged;

  const canSavePatch =
    (inputSliceValue["KnowledgeBasePatch-TextArea"] ?? "").replaceAll(" ", "") !==
      "" && isPatchJsonValid;

  const HandleSelectIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      selectedId: singleId ?? "",
    }));
  };

  const HandleSelectWhatDoButtonOnClick = (whatToDo: WhatToDoType) => {
    if (!whatToDo) return;

    setComponentState((previousStateVal) => ({
      ...previousStateVal,
      whatImDoing: whatToDo,
    }));
  };

  const HandleSaveEditButtonOnClick = () => {
    UpdateKnowledgeBaseDetailAPI({
      data: {
        id: componentState?.selectedId ?? "",
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
        id: componentState?.selectedId ?? "",
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
    if (componentState.selectedId === "") return;

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
      {/* Colonna sinistra */}
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
          <div style={sectionTitleStyle}>Knowledge Base</div>

          <div
            style={{
              maxHeight: "320px",
              overflow: "auto",
              paddingRight: "4px",
            }}
          >
            {(knowledgeBaseListSlice?.value ?? []).length > 0 ? (
              (knowledgeBaseListSlice?.value ?? []).map(
                (singleItem: KnowledgeBaseListInterface) => {
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
              <span style={{ opacity: 0.6 }}>Nessuna knowledge base trovata</span>
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
          <div style={sectionTitleStyle}>Preview knowledge base</div>

          {componentState.selectedId !== "" ? (
            knowledgeBaseListSlice.detail ? (
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
                  {JSON.stringify(knowledgeBaseListSlice.detail, null, 2)}
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
              Seleziona una knowledge base per vedere l’anteprima
            </div>
          )}
        </div>
      </div>

      {/* Colonna destra */}
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
                {selectedKnowledgeBase?.name ?? "Knowledge Base"}
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
                      value={inputSliceValue["KnowledgeBaseDetails-Edit"] ?? ""}
                      onChange={(value) => {
                        dispatch(
                          SetInputSlice({
                            id: "KnowledgeBaseDetails-Edit",
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
                      Applica patch o valida senza salvare
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
                        Controlla la patch senza salvare modifiche
                      </span>
                    </div>

                    <Suspense fallback="">
                      <Toggle
                        checked={componentState?.validateOnly ?? false}
                        onChange={(val: boolean) => {
                          setComponentState((previousStateVal) => ({
                            ...previousStateVal,
                            validateOnly: val,
                          }));
                        }}
                      />
                    </Suspense>
                  </div>
                </div>

                {componentState.validateOnly && (
                  <div
                    style={{
                      backgroundColor: "#fff8db",
                      border: "1px solid #fde68a",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "18px",
                        color: "#ca8a04",
                        userSelect: "none",
                      }}
                    >
                      warning
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#854d0e",
                        fontWeight: 500,
                      }}
                    >
                      Modalità Validate Only attiva — nessuna modifica verrà
                      salvata
                    </span>
                  </div>
                )}

                <div>
                  <KnowledgeBasePatchFormTag inputPrefix="KnowledgeBasePatch" />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "14px",
                  }}
                >
                  <BasicButtonGenericTag
                    textToSee="Salva patch"
                    disabledButton={!canSavePatch}
                    clickCallBack={HandleSavePatchButtonOnClick}
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
            Seleziona una knowledge base dalla lista a sinistra per iniziare
          </div>
        )}
      </div>
    </div>
  );
}

export default KnowledgeBasePageTag;