import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import yaml from "js-yaml";

import {
  GetConfigListIdsAPIHook,
  GetConfigListDetailAPIHook,
  UpdateConfigYamlAPIHook,
} from "../../../customHooks/API/Config/ConfigAPI";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import type { ConfigListInterface } from "../../../stores/slices/Base/configListSlice";

const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

const inputPrefix = "ConfigManagement";

interface ComponentStateInterface {
  selectedId: string;
  originalYamlValue: string;
  yamlError: string;
  isSaving: boolean;
}

function ConfigManagementPage() {
  const dispatch = useDispatch();

  const [GetConfigListIdsAPI] = GetConfigListIdsAPIHook();
  const [GetConfigListDetailAPI] = GetConfigListDetailAPIHook();
  const [UpdateConfigYamlAPI] = UpdateConfigYamlAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      originalYamlValue: "",
      yamlError: "",
      isSaving: false,
    },
  );

  const configListSlice: { value: ConfigListInterface[] | null; detail: any } =
    useSelector(
      (state: {
        configListSlice: {
          value: ConfigListInterface[] | null;
          detail: any;
        };
      }) => state.configListSlice,
    );

  const inputSlice: {
    value: Record<string, string>;
  } = useSelector(
    (state: {
      inputSlice: {
        value: Record<string, string>;
      };
    }) => state.inputSlice,
  );

  const yamlInputKey = `${inputPrefix}-Yaml`;

  const currentYamlValue = useMemo(() => {
    return inputSlice?.value?.[yamlInputKey] ?? "";
  }, [inputSlice?.value, yamlInputKey]);

  const selectedConfig = useMemo(() => {
    return (configListSlice?.value ?? []).find(
      (item) => item.id === componentState.selectedId,
    );
  }, [configListSlice?.value, componentState.selectedId]);

  const yamlPreviewValue = useMemo(() => {
    if (!configListSlice?.detail) return "";

    try {
      if (typeof configListSlice.detail === "string") {
        try {
          const parsedValue = JSON.parse(configListSlice.detail);
          return yaml.dump(parsedValue, {
            indent: 2,
            noRefs: true,
            lineWidth: -1,
          });
        } catch {
          return configListSlice.detail;
        }
      }

      return yaml.dump(configListSlice.detail, {
        indent: 2,
        noRefs: true,
        lineWidth: -1,
      });
    } catch {
      return String(configListSlice.detail ?? "");
    }
  }, [configListSlice?.detail]);

  const hasChanges = useMemo(() => {
    return (
      String(currentYamlValue ?? "") !==
      String(componentState.originalYamlValue ?? "")
    );
  }, [currentYamlValue, componentState.originalYamlValue]);

  const isYamlValid = useMemo(() => {
    if (!currentYamlValue?.trim()) return false;

    try {
      yaml.load(currentYamlValue);
      return true;
    } catch {
      return false;
    }
  }, [currentYamlValue]);

  const canSave =
    !!componentState.selectedId &&
    hasChanges &&
    isYamlValid &&
    !componentState.isSaving;

  const HandleSelectIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => ({
      ...previousStateVal,
      selectedId: singleId ?? "",
      yamlError: "",
    }));
  };

  const HandleYamlOnChange = (value?: string) => {
    const newValue = value ?? "";

    dispatch(
      SetInputSlice({
        id: yamlInputKey,
        value: newValue,
      }),
    );

    try {
      yaml.load(newValue);

      setComponentState((previousStateVal: ComponentStateInterface) => ({
        ...previousStateVal,
        yamlError: "",
      }));
    } catch (error: any) {
      setComponentState((previousStateVal: ComponentStateInterface) => ({
        ...previousStateVal,
        yamlError: String(error?.message ?? "YAML non valido"),
      }));
    }
  };

  const HandleSaveOnClick = async () => {
    if (!canSave) return;

    try {
      setComponentState((previousStateVal: ComponentStateInterface) => ({
        ...previousStateVal,
        isSaving: true,
        yamlError: "",
      }));

      yaml.load(currentYamlValue);

      UpdateConfigYamlAPI({
        showLoader: true,
        showToast: true,
        data: {
          id: componentState.selectedId,
          file: currentYamlValue,
        },
        EndCallback: () => {
          setComponentState((previousStateVal: ComponentStateInterface) => ({
            ...previousStateVal,
            originalYamlValue: currentYamlValue,
            isSaving: false,
          }));
        },
      });
    } catch (error: any) {
      setComponentState((previousStateVal: ComponentStateInterface) => ({
        ...previousStateVal,
        isSaving: false,
        yamlError: String(error?.message ?? "Errore durante il salvataggio"),
      }));
    }
  };

  useEffect(() => {
    GetConfigListIdsAPI({ showLoader: true, saveResponse: true });
  }, []);

  useEffect(() => {
    if (componentState.selectedId === "") return;

    GetConfigListDetailAPI({
      data: { id: componentState.selectedId },
      showLoader: true,
      saveResponse: true,
    });
  }, [componentState.selectedId]);

  useEffect(() => {
    if (!componentState.selectedId) return;

    dispatch(
      SetInputSlice({
        id: yamlInputKey,
        value: yamlPreviewValue,
      }),
    );

    setComponentState((previousStateVal: ComponentStateInterface) => ({
      ...previousStateVal,
      originalYamlValue: yamlPreviewValue,
      yamlError: "",
    }));
  }, [yamlPreviewValue, componentState.selectedId, dispatch]);

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
          <div style={sectionTitleStyle}>Config YAML</div>

          <div
            style={{
              maxHeight: "320px",
              overflow: "auto",
              paddingRight: "4px",
            }}
          >
            {(configListSlice?.value ?? []).length > 0 ? (
              (configListSlice?.value ?? []).map(
                (singleItem: ConfigListInterface) => {
                  const isSelected =
                    componentState.selectedId === (singleItem?.id ?? "");

                  return (
                    <div
                      key={singleItem?.id ?? ""}
                      className="HoverTransform"
                      style={selectionItemStyle(isSelected)}
                      onClick={() =>
                        HandleSelectIdOnClick(singleItem?.id ?? "")
                      }
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
              <span style={{ opacity: 0.6 }}>Nessun file yaml trovato</span>
            )}
          </div>
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
              <div style={subtleTitleStyle}>File selezionato</div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {selectedConfig?.name ?? "Config YAML"}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginBottom: componentState.yamlError ? "14px" : "0",
                }}
              >
                <div>
                  <div style={sectionTitleStyle}>Editor YAML</div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginTop: "-4px",
                    }}
                  >
                    Modifica il contenuto del file YAML e salva le modifiche
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {hasChanges ? (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "999px",
                        backgroundColor: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#9a3412",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Modifiche non salvate
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "999px",
                        backgroundColor: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        color: "#065f46",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Nessuna modifica
                    </div>
                  )}

                  <BasicButtonGenericTag
                    textToSee={
                      componentState.isSaving ? "Salvataggio..." : "Salva"
                    }
                    disabledButton={!canSave}
                    clickCallBack={HandleSaveOnClick}
                  />
                </div>
              </div>

              {componentState.yamlError ? (
                <div
                  style={{
                    width: "100%",
                    marginBottom: "14px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                >
                  {componentState.yamlError}
                </div>
              ) : (
                <></>
              )}

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
                    height="620px"
                    defaultLanguage="yaml"
                    value={currentYamlValue}
                    onChange={HandleYamlOnChange}
                    options={{
                      readOnly: false,
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      tabSize: 2,
                      automaticLayout: true,
                    }}
                  />
                </Suspense>
              </div>
            </div>
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
            Seleziona un file yaml dalla lista a sinistra per iniziare
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfigManagementPage;
