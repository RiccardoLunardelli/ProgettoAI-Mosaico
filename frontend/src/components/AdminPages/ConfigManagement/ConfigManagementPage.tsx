import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import yaml from "js-yaml";
import { GetConfigListIdsAPIHook, GetConfigListDetailAPIHook } from "../../../customHooks/API/Config/ConfigAPI";


const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

interface ComponentStateInterface {
  selectedId: string;
}

function ConfigManagementPage() {
  const [GetConfigListIdsAPI] = GetConfigListIdsAPIHook();
  const [GetConfigListDetailAPI] = GetConfigListDetailAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
    },
  );

  const configListSlice: { value: string[] | null; detail: any } = useSelector(
    (state: {
      configListSlice: {
        value: string[] | null;
        detail: any;
      };
    }) => state.configListSlice,
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
    GetConfigListIdsAPI({ showLoader: true, saveResponse: true });
  }, []);

  useEffect(() => {
    if (componentState.selectedId == "") return;

    GetConfigListDetailAPI({
      data: { name: componentState.selectedId },
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
      {/* Parte Sinistra */}
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
                    {(configListSlice?.value ?? []).map((singleId: string) => {
                      const isSelected =
                        componentState.selectedId === (singleId ?? "");

                      return (
                        <div
                          key={singleId}
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
                            {singleId}
                          </span>
                        </div>
                      );
                    })}
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

      {/* Parte Destra */}
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
                opacity: "0.5",
                fontSize: "14px",
              }}
            >
              Preview Monaco YAML
            </div>

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
                  value={yamlPreviewValue}
                  options={{
                    readOnly: true,
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