import { lazy, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { GetEnrichedIdsAPIHook } from "../../customHooks/API/DeviceList/DeviceListAPI";
import type { DeviceListStoreFileInterface } from "../../stores/slices/Base/deviceListSlice";
import type { WhatIsSelcted } from "./DeviceListPageManager";

const EnrichPreviewModalTag = lazy(() => import("./EnrichPreviewModal"));

const BasicButtonGenericTag = lazy(
  () => import("../button/BasicButtonGeneric"),
);

interface ComponentStateInterface {
  selectedFile: string;
  selectedStore: string;
  showModal: boolean;
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
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "30px",
            marginLeft: "45px",
            marginRight: "45px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginTop: "10px",
              marginLeft: "10px",
            }}
          >
            <div style={{width: "55%", display: "flex", marginBottom: "10px"}}>
              <Suspense fallback="">
                <BasicButtonGenericTag
                  textToSee="Torna indietro"
                  clickCallBack={() => {
                    clickCallBack("home");
                  }}
                />
              </Suspense>
            </div>

            <div style={{width: "65%", display: "flex"}}>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "18px",
                }}
              >
                Files Enriched
              </span>
            </div>
          </div>

          {(deviceListSlice?.enrichedValue ?? []).length > 0 ? (
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
              {(deviceListSlice?.enrichedValue ?? []).map(
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
            <span style={{ opacity: "60%" }}>Nessun file enriched trovato</span>
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
