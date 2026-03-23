import { lazy, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { GetEnrichedIdsAPIHook } from "../../customHooks/API/DeviceList/DeviceListAPI";
import type { DeviceListStoreFileInterface } from "../../stores/slices/Base/deviceListSlice";
import type { WhatIsSelcted } from "./DeviceListPageManager";

const EnrichPreviewModalTag = lazy(() => import("./EnrichPreviewModal"));

interface ComponentStateInterface {
  selectedFile: string;
  selectedStore: string;
  showModal: boolean;
  searchValue: string;
}

function EnrichListPageTag({
  clickCallBack,
}: {
  clickCallBack: (whereImGoing: WhatIsSelcted) => void;
}) {
  const [GetEnrichedIdsAPI] = GetEnrichedIdsAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedFile: "",
      selectedStore: "",
      showModal: false,
      searchValue: "",
    },
  );

  const deviceListSlice: {
    enrichedValue: DeviceListStoreFileInterface[] | null;
    enrichedDetail: any;
  } = useSelector(
    (state: {
      deviceListListSlice: {
        enrichedValue: DeviceListStoreFileInterface[] | null;
        enrichedDetail: any;
      };
    }) => state.deviceListListSlice,
  );

  const filteredEnrichedList = useMemo(() => {
    const sourceList = deviceListSlice?.enrichedValue ?? [];
    const normalizedSearchValue = componentState.searchValue
      .trim()
      .toLowerCase();

    if (normalizedSearchValue === "") return sourceList;

    return sourceList.filter((singleEnriched: DeviceListStoreFileInterface) => {
      const storeValue = String(singleEnriched?.store ?? "").toLowerCase();
      const fileValue = String(singleEnriched?.file ?? "").toLowerCase();

      return (
        storeValue.includes(normalizedSearchValue) ||
        fileValue.includes(normalizedSearchValue)
      );
    });
  }, [deviceListSlice?.enrichedValue, componentState.searchValue]);

  const HandleSelectEnrichedOnClick = (
    singleStore: string,
    singleFile: string,
  ) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedStore: singleStore ?? "",
        selectedFile: singleFile ?? "",
        showModal: true,
      };
    });
  };

  const HandleCloseModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showModal: false,
        selectedFile: "",
        selectedStore: "",
      };
    });
  };

  const HandleSearchOnChange = (value: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        searchValue: value,
      };
    });
  };

  const HandleResetSearchOnClick = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        searchValue: "",
      };
    });
  };

  useEffect(() => {
    GetEnrichedIdsAPI({ showLoader: true, saveResponse: true });
  }, []);

  return (
    <>
      <div
        style={{
          backgroundColor: "#f9fafb",
          height: "100%",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          overflow: "auto",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
            minHeight: "64px",
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
            className="HoverTransform"
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
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
              fontSize: "22px",
              fontWeight: 600,
              color: "#111827",
              textAlign: "center",
            }}
          >
            Files Enriched
          </span>

          <div style={{ width: "132px" }} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "24px",
            marginLeft: "45px",
            marginRight: "45px",
            width: "calc(100% - 90px)",
            boxSizing: "border-box",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Ricerca
              </span>

              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Risultati: {filteredEnrichedList.length}
                {" / "}
                {(deviceListSlice?.enrichedValue ?? []).length}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  minWidth: "260px",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "18px",
                    color: "#9ca3af",
                    userSelect: "none",
                  }}
                >
                  search
                </span>

                <input
                  value={componentState.searchValue}
                  onChange={(e) => {
                    HandleSearchOnChange(e.target.value);
                  }}
                  placeholder="Cerca per store o file..."
                  style={{
                    width: "100%",
                    height: "42px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    paddingLeft: "40px",
                    paddingRight: "12px",
                    fontSize: "13px",
                    outline: "none",
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                onClick={HandleResetSearchOnClick}
                className="HoverTransform"
                style={{
                  height: "42px",
                  padding: "0 14px",
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
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "18px",
                    opacity: "0.8",
                    userSelect: "none",
                  }}
                >
                  close
                </span>

                <span>Pulisci</span>
              </button>
            </div>
          </div>

          {filteredEnrichedList.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "16px",
                width: "100%",
                paddingBottom: "25px",
                boxSizing: "border-box",
              }}
            >
              {filteredEnrichedList.map(
                (
                  singleEnriched: DeviceListStoreFileInterface,
                  index: number,
                ) => {
                  const isSelected =
                    componentState.selectedFile ===
                      (singleEnriched?.file ?? "") &&
                    componentState.selectedStore ===
                      (singleEnriched?.store ?? "");

                  return (
                    <div
                      key={`${singleEnriched.store}-${singleEnriched.file}-${index}`}
                      className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                      onClick={() => {
                        HandleSelectEnrichedOnClick(
                          singleEnriched.store,
                          singleEnriched.file,
                        );
                      }}
                      style={{
                        borderRadius: "12px",
                        padding: "16px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        boxSizing: "border-box",
                        minHeight: "130px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        overflow: "hidden",
                        transition: "all 0.18s ease",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "var(--black)",
                            lineHeight: "1.4",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {singleEnriched.store}
                        </span>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            lineHeight: "1.4",
                          }}
                        >
                          Clicca per aprire la preview completa
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "16px",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: "999px",
                            backgroundColor: "#eef4ff",
                            color: "#477dda",
                            border: "1px solid #dbe6ff",
                            maxWidth: "100%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {singleEnriched.file}
                        </span>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            flexShrink: 0,
                          }}
                        >
                          Apri
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "20px",
                color: "#6b7280",
                fontSize: "14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              Nessun file enriched trovato
            </div>
          )}
        </div>
      </div>

      <EnrichPreviewModalTag
        showModal={componentState.showModal}
        selectedFile={componentState.selectedFile}
        selectedStore={componentState.selectedStore}
        onClose={HandleCloseModal}
      />
    </>
  );
}

export default EnrichListPageTag;