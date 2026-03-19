import { lazy, Suspense } from "react";
import type { DeviceListStoreFileInterface } from "../../../stores/slices/Base/deviceListSlice";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

interface TemplateStepDeviceListEnrichedSelectionTagPropsInterface {
  selectedDeviceListEnriched: DeviceListStoreFileInterface | null;
  deviceListEnrichedList: DeviceListStoreFileInterface[];
  deviceListEnrichedDetail: any;
  mainCardWidth: string;
  mainCardMinWidth: string;
  contentWidth: string;
  infoCardHeight: string;
  listCardHeight: string;
  footerWidth: string;
  onSelectDeviceListEnriched: (
    selectedItem: DeviceListStoreFileInterface,
  ) => void;
  onNext: () => void;
}

function TemplateStepDeviceListEnrichedSelectionTag({
  selectedDeviceListEnriched,
  deviceListEnrichedList,
  deviceListEnrichedDetail,
  mainCardWidth,
  mainCardMinWidth,
  contentWidth,
  infoCardHeight,
  listCardHeight,
  footerWidth,
  onSelectDeviceListEnriched,
  onNext,
}: TemplateStepDeviceListEnrichedSelectionTagPropsInterface) {
  const GetRowKey = (item: DeviceListStoreFileInterface) => {
    return `${(item as any)?.store ?? ""}__${(item as any)?.dl ?? ""}`;
  };

  const GetRowLabel = (item: DeviceListStoreFileInterface) => {
    if (item.store && item.file) {
      return `${item.store} / ${item.file}`;
    }

    return "Senza nome";
  };

  const selectedKey = selectedDeviceListEnriched
    ? GetRowKey(selectedDeviceListEnriched)
    : "";

  return (
    <>
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
          width: mainCardWidth,
          minWidth: mainCardMinWidth,
          height: listCardHeight,
          minHeight: "260px",
          display: "flex",
          justifyContent: "flex-start",
          marginLeft: "30px",
          marginTop: "30px",
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
            Device List Enriched
          </span>

          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              marginTop: "10px",
            }}
          >
            {(deviceListEnrichedList ?? []).length > 0 ? (
              <>
                {(deviceListEnrichedList ?? []).map(
                  (singleItem: DeviceListStoreFileInterface) => {
                    const isSelected =
                      selectedKey !== "" &&
                      selectedKey === GetRowKey(singleItem);

                    return (
                      <div
                        key={GetRowKey(singleItem)}
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
                          onSelectDeviceListEnriched(singleItem);
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          {GetRowLabel(singleItem)}
                        </span>
                      </div>
                    );
                  },
                )}
              </>
            ) : (
              <span style={{ opacity: "60%" }}>
                Nessun device list enriched trovato
              </span>
            )}
          </div>
        </div>
      </div>

      {deviceListEnrichedDetail && selectedDeviceListEnriched ? (
        <>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              opacity: "50%",
              width: contentWidth,
              minWidth: mainCardMinWidth,
              marginLeft: "30px",
            }}
          >
            Preview device list enriched
          </div>

          <div
            style={{
              backgroundColor: "#f3f5f7",
              borderRadius: "8px",
              padding: "10px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              boxSizing: "border-box",
              width: contentWidth,
              minWidth: mainCardMinWidth,
              height: infoCardHeight,
              minHeight: "300px",
              display: "flex",
              justifyContent: "flex-start",
              overflow: "auto",
              marginLeft: "30px",
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
              {JSON.stringify(deviceListEnrichedDetail, null, 2)}
            </pre>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              width: footerWidth,
              minWidth: mainCardMinWidth,
              marginTop: "18px",
            }}
          >
            <Suspense fallback="">
              <BasicButtonGenericTag
                textToSee="Avanti alla knowledge base"
                disabledButton={!selectedDeviceListEnriched}
                clickCallBack={onNext}
              />
            </Suspense>
          </div>
        </>
      ) : (
        <>{selectedDeviceListEnriched && <RunsListSkeleton />}</>
      )}
    </>
  );
}

export default TemplateStepDeviceListEnrichedSelectionTag;
