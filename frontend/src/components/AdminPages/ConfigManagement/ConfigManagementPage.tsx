import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import yaml from "js-yaml";

import {
  GetConfigListIdsAPIHook,
  GetConfigListDetailAPIHook,
  UpdateConfigYamlAPIHook,
  // UpdateConfigListDetailAPIHook,
} from "../../../customHooks/API/Config/ConfigAPI";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import type { ConfigListInterface } from "../../../stores/slices/Base/configListSlice";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

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

  const HandleSelectIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedId: singleId ?? "",
        yamlError: "",
      };
    });
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

  useEffect(() => {
    if (!componentState.selectedId) return;

    dispatch(
      SetInputSlice({
        id: yamlInputKey,
        value: yamlPreviewValue,
      }),
    );

    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        originalYamlValue: yamlPreviewValue,
        yamlError: "",
      };
    });
  }, [yamlPreviewValue, componentState.selectedId, dispatch]);

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

      setComponentState((previousStateVal: ComponentStateInterface) => {
        return {
          ...previousStateVal,
          yamlError: "",
        };
      });
    } catch (error: any) {
      setComponentState((previousStateVal: ComponentStateInterface) => {
        return {
          ...previousStateVal,
          yamlError: String(error?.message ?? "YAML non valido"),
        };
      });
    }
  };

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

  const HandleSaveOnClick = async () => {
    if (!canSave) return;

    try {
      setComponentState((previousStateVal: ComponentStateInterface) => {
        return {
          ...previousStateVal,
          isSaving: true,
          yamlError: "",
        };
      });


      //Se vuoi il JSON usa parsedYamlValue
      const parsedYamlValue = yaml.load(currentYamlValue);
      //Se vuoi la stringa utilizza currentYamlValue

      UpdateConfigYamlAPI({
        showLoader: true,
        showToast: true,
        data: {
          id: componentState.selectedId,
          file: currentYamlValue // Qui metti che tipo di file vuoi,
        },
        EndCallback: () => {
          setComponentState((previousStateVal: ComponentStateInterface) => {
            return {
              ...previousStateVal,
              originalYamlValue: currentYamlValue,
              isSaving: false,
            };
          });
        },
      });

      console.log("SAVE CONFIG YAML", {
        name: componentState.selectedId,
        content: currentYamlValue,
      });

      setComponentState((previousStateVal: ComponentStateInterface) => {
        return {
          ...previousStateVal,
          originalYamlValue: currentYamlValue,
          isSaving: false,
        };
      });
    } catch (error: any) {
      setComponentState((previousStateVal: ComponentStateInterface) => {
        return {
          ...previousStateVal,
          isSaving: false,
          yamlError: String(error?.message ?? "Errore durante il salvataggio"),
        };
      });
    }
  };

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
      <div
        style={{
          height: "100%",
          width: "50%",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "30px",
            marginLeft: "45px",
          }}
        >
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
                Config YAML
              </span>

              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                  marginTop: "10px",
                }}
              >
                {(configListSlice?.value ?? []).length > 0 ? (
                  <>
                    {(configListSlice?.value ?? []).map(
                      (singleId: ConfigListInterface) => {
                        const isSelected =
                          componentState.selectedId === (singleId?.id ?? "");

                        return (
                          <div
                            key={singleId?.id ?? ""}
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
                              HandleSelectIdOnClick(singleId?.id ?? "");
                            }}
                          >
                            <span style={{ fontSize: "14px", fontWeight: 500 }}>
                              {singleId.name}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </>
                ) : (
                  <span style={{ opacity: "60%" }}>
                    Nessun file yaml trovato
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
        {componentState.selectedId ? (
          <>
            <div
              style={{
                marginTop: "30px",
                marginBottom: "12px",
                width: "90%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div
                style={{
                  opacity: "0.5",
                  fontSize: "14px",
                }}
              >
                Preview Monaco YAML
              </div>

              <button
                onClick={HandleSaveOnClick}
                disabled={!canSave}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: canSave ? "1px solid #477dda" : "1px solid #d1d5db",
                  backgroundColor: canSave ? "#477dda" : "#f3f4f6",
                  color: canSave ? "#ffffff" : "#9ca3af",
                  cursor: canSave ? "pointer" : "not-allowed",
                  fontWeight: 600,
                }}
              >
                {componentState.isSaving ? "Salvataggio..." : "Salva"}
              </button>
            </div>

            {componentState.yamlError ? (
              <div
                style={{
                  width: "90%",
                  marginBottom: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
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
                width: "90%",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                overflow: "hidden",
                backgroundColor: "#f9fafb",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              <Suspense fallback="">
                <MonacoEditorTag
                  height="700px"
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
          </>
        ) : componentState.selectedId !== "" ? (
          <Suspense fallback="">
            <RunsListSkeleton />
          </Suspense>
        ) : (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: "0.5",
              fontSize: "14px",
            }}
          >
            Seleziona un file yaml
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfigManagementPage;
