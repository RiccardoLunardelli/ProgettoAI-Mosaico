import { useSelector } from "react-redux";
import type {
  DeviceListEnumInterface,
  DeviceListStoreFileInterface,
} from "../../stores/slices/Base/deviceListSlice";
import { lazy, useEffect, useState } from "react";
import {
  GetDeviceListDetailAPIHook,
  GetDeviceListIdsAPIHook,
  GetEnumDeviceListAPIHook,
  RunDeviceListAPIHook,
} from "../../customHooks/API/DeviceList/DeviceListAPI";

import { getJsonDiffLines } from "../../commons/commonsFunctions";
import type { WhatIsSelcted } from "./DeviceListPageManager";

const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));

const BasicButtonGenericTag = lazy(
  () => import("../button/BasicButtonGeneric"),
);

const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);

interface ComponentStateInterface {
  selectedStore: string;
  selectedFile: string;
  validateOnly: boolean;
  warning: null | string[];
  enriched_file: [] | null;
}

function NoEnrichListPageTag({
  clickCallBack,
}: {
  clickCallBack: (whereImGoing: WhatIsSelcted) => void;
}) {
  const [GetDeviceListIdsAPI] = GetDeviceListIdsAPIHook();
  const [GetDeviceListDetailAPI] = GetDeviceListDetailAPIHook();
  const [RunDeviceListAPI] = RunDeviceListAPIHook();
  const [GetEnumDeviceListAPI] = GetEnumDeviceListAPIHook();

  const deviceListListSlice: {
    value: DeviceListStoreFileInterface[];
    detail: any;
    enum: DeviceListEnumInterface;
  } = useSelector(
    (state: {
      deviceListListSlice: {
        value: DeviceListStoreFileInterface[];
        detail: any;
        enum: DeviceListEnumInterface;
      };
    }) => state.deviceListListSlice,
  );

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedStore: "",
      selectedFile: "",
      validateOnly: false,
      warning: null,
      enriched_file: null,
    },
  );

  const HandleSelectIdOnClick = (singleStore: string, singleFile: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedStore: singleStore ?? "",
        selectedFile: singleFile ?? "",
      };
    });
  };

  const HandleSaveButtonOnClick = () => {
    RunDeviceListAPI({
      showLoader: true,
      showToast: true,
      saveResponse: false,
      data: {
        store: componentState?.selectedStore ?? "",
        device_list_name: componentState?.selectedFile ?? "",
        validate_only: componentState?.validateOnly ?? true,
      },
      EndCallback(result) {
        setComponentState((previousStateVal: ComponentStateInterface) => {
          return {
            ...previousStateVal,
            warning: result?.message?.warning ?? null,
            enriched_file: result?.message?.enriched_file ?? null,
          };
        });
      },
    });
  };

  useEffect(() => {
    GetDeviceListIdsAPI({ showLoader: true, saveResponse: true });
    GetEnumDeviceListAPI({ showLoader: true, saveResponse: true });
  }, []);

  useEffect(() => {
    if (!componentState.selectedStore || !componentState.selectedFile) return;

    GetDeviceListDetailAPI({
      data: {
        store: componentState.selectedStore,
        dl: componentState.selectedFile,
      },
      showLoader: true,
      saveResponse: true,
      EndCallback() {},
    });

    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        warning: null,
        enriched_file: null,
      };
    });
  }, [componentState.selectedStore, componentState.selectedFile]);

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
      {/* Parte Sinistra pagina divisa */}
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
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
            paddingLeft: "20px",
            paddingRight: "20px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          <button
            onClick={() => {
              clickCallBack("home");
            }}
            style={{
              height: "38px",
              padding: "0 14px 0 12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              color: "#374151",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.18s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
            className="HoverTransform"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "18px",
                opacity: "0.8",
                userSelect: "none",
              }}
            >
              arrow_back
            </span>

            <span>Torna indietro</span>
          </button>

          <span
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            No Enrich DeviceList
          </span>

          <div style={{ width: "120px" }} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "20px",
            marginLeft: "45px",
            marginRight: "25px",
            height: "calc(100% - 84px)",
            boxSizing: "border-box",
          }}
        >
          {/* Riga alta: lista + enum */}
          <div
            style={{
              display: "flex",
              gap: "18px",
              alignItems: "stretch",
              width: "100%",
            }}
          >
            {/* Lista device */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                boxSizing: "border-box",
                width: "65%",
                height: "33vh",
                display: "flex",
                justifyContent: "flex-start",
                minHeight: "240px",
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
                  DeviceList
                </span>

                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                    marginTop: "10px",
                  }}
                >
                  {(deviceListListSlice?.value ?? []).length > 0 ? (
                    <>
                      {(deviceListListSlice?.value ?? []).map(
                        (
                          singleRun: DeviceListStoreFileInterface,
                          index: number,
                        ) => {
                          const isSelected =
                            componentState.selectedStore ===
                              (singleRun?.store ?? "") &&
                            componentState.selectedFile ===
                              (singleRun?.file ?? "");

                          return (
                            <div
                              key={`${singleRun.store}-${singleRun.file}-${index}`}
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
                                HandleSelectIdOnClick(
                                  singleRun.store,
                                  singleRun.file,
                                );
                              }}
                            >
                              <span
                                style={{ fontSize: "14px", fontWeight: 500 }}
                              >
                                {singleRun.store}
                                {" / "}
                                {singleRun.file}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </>
                  ) : (
                    <span style={{ opacity: "60%" }}>
                      Nessun device trovata
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Enum */}
            <div
              style={{
                width: "35%",
                minWidth: "180px",
                display: "flex",
                flexDirection: "column",

                // 👉 effetto card (leggero)
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                border: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 500,
                  marginBottom: "8px",
                }}
              >
                Enum disponibili
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: "240px",
                  maxHeight: "28vh",
                  overflow: "auto",
                  fontSize: "13px",
                  paddingRight: "4px",
                }}
              >
                {deviceListListSlice.enum &&
                Object.keys(deviceListListSlice.enum).length > 0 ? (
                  Object.entries(deviceListListSlice.enum).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "6px 6px",
                          borderRadius: "6px",
                          marginBottom: "4px",

                          // 👉 hover leggero
                          transition: "background 0.15s",
                        }}
                        className="HoverTransform"
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#111827",
                            minWidth: "28px",
                          }}
                        >
                          {key}
                        </span>

                        <span
                          style={{
                            color: "#475569",
                            textAlign: "right",
                            flex: 1,
                            wordBreak: "break-word",
                          }}
                        >
                          {String(value)}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <span style={{ opacity: "0.6" }}>
                    Nessun enum disponibile
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Preview device */}
          {deviceListListSlice.detail &&
          componentState.selectedStore &&
          componentState.selectedFile !== "" ? (
            <>
              <div
                style={{ marginTop: "10px", display: "flex", opacity: "50%" }}
              >
                Preview device
              </div>

              <div
                style={{
                  backgroundColor: "#f3f5f7",
                  borderRadius: "8px",
                  padding: "10px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  boxSizing: "border-box",
                  width: "100%",
                  height: "40vh",
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
                  {JSON.stringify(deviceListListSlice.detail, null, 2)}
                </pre>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
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

                <div style={{ marginTop: "30px", marginLeft: "10px" }}>
                  <BasicButtonGenericTag
                    textToSee="Run"
                    disabledButton={
                      componentState.selectedFile == "" ||
                      componentState.selectedStore == ""
                    }
                    clickCallBack={HandleSaveButtonOnClick}
                  />
                </div>

                {componentState.validateOnly ? (
                  <div
                    style={{
                      backgroundColor: "#fff9e6",
                      width: "60%",
                      height: "5%",
                      marginTop: "20px",
                      borderRadius: "8px",
                      border: "1px solid #f5dead",
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      marginLeft: "20px",
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
                ) : null}
              </div>
            </>
          ) : (
            <>
              {componentState.selectedStore &&
                componentState.selectedFile !== "" && <RunsListSkeleton />}
            </>
          )}
        </div>
      </div>

      {/* Parte Destra pagina divisa */}
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
        {componentState.enriched_file ? (
          <>
            <div style={{ marginTop: "20px", opacity: "50%" }}>Changes</div>

            <div
              style={{
                backgroundColor: "#f3f5f7",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                boxSizing: "border-box",
                width: "95%",
                height: "40vh",
                display: "flex",
                justifyContent: "flex-start",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  margin: 0,
                  textAlign: "left",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "13px",
                  width: "100%",
                  fontFamily: "monospace",
                }}
              >
                {getJsonDiffLines(
                  deviceListListSlice.detail,
                  componentState.enriched_file,
                ).map(
                  (
                    singleLine: {
                      line: string;
                      type: "same" | "added" | "removed";
                    },
                    index: number,
                  ) => (
                    <div
                      key={`${singleLine.line}-${index}`}
                      style={{
                        backgroundColor:
                          singleLine.type === "added"
                            ? "#e8f5e9"
                            : singleLine.type === "removed"
                              ? "#ffebee"
                              : "transparent",
                        color:
                          singleLine.type === "added"
                            ? "#1b5e20"
                            : singleLine.type === "removed"
                              ? "#b71c1c"
                              : "inherit",
                        display: "block",
                        width: "100%",
                      }}
                    >
                      {singleLine.line}
                    </div>
                  ),
                )}
              </div>
            </div>
          </>
        ) : null}

        <div style={{ width: "95%" }}>
          {componentState.warning && componentState.warning.length > 0 ? (
            <div
              style={{
                backgroundColor: "#fff9e6",
                width: "100%",
                height: "auto",
                marginTop: "20px",
                borderRadius: "8px",
                border: "1px solid #f5dead",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                padding: "16px",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  marginRight: "12px",
                  opacity: "0.6",
                  userSelect: "none",
                  marginTop: "2px",
                }}
                className="material-symbols-outlined"
              >
                warning
              </span>

              <div style={{ fontSize: "13px", opacity: "0.9" }}>
                <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                  Attenzione, trovati {componentState.warning.length} warning
                </div>

                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  {componentState.warning.map(
                    (singleWarning: string, index: number) => (
                      <li
                        key={`${singleWarning}-${index}`}
                        style={{ marginBottom: "4px" }}
                      >
                        {singleWarning}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default NoEnrichListPageTag;
