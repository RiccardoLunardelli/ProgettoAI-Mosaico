import { useEffect } from "react";
import { useSelector } from "react-redux";
import RunsListSkeleton from "../Skeleton/RunsListSkeleton";
import { GetEnrichedDetailAPIHook } from "../../customHooks/API/DeviceList/DeviceListAPI";
import type { DeviceListStoreFileInterface } from "../../stores/slices/Base/deviceListSlice";

interface EnrichPreviewModalPropsInterface {
  showModal: boolean;
  selectedFile: string;
  selectedStore: string;
  onClose: () => void;
}

function EnrichPreviewModalTag({
  showModal,
  selectedFile,
  selectedStore,
  onClose,
}: EnrichPreviewModalPropsInterface) {
  const [GetEnrichedDetailAPI] = GetEnrichedDetailAPIHook();

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

  useEffect(() => {
    if (!selectedFile || !selectedStore || !showModal) return;

    GetEnrichedDetailAPI({
      data: {
        store: selectedStore,
        dl: selectedFile,
      },
      showLoader: true,
      saveResponse: true,
    });
  }, [selectedFile, selectedStore, showModal]);

  if (!showModal) return <></>;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.35)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1100px, 92vw)",
          height: "min(82vh, 820px)",
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.20)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            minHeight: "72px",
            height: "72px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Preview enriched file
            </span>

            <span
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "800px",
              }}
            >
              {selectedStore} / {selectedFile}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: "#f8fafc",
            padding: "18px",
            boxSizing: "border-box",
            overflow: "auto",
          }}
        >
          {deviceListSlice.enrichedDetail && selectedFile !== "" ? (
            <pre
              style={{
                margin: 0,
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                fontSize: "13px",
                lineHeight: "1.5",
                width: "100%",
                color: "#111827",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {JSON.stringify(deviceListSlice.enrichedDetail, null, 2)}
            </pre>
          ) : (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <RunsListSkeleton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnrichPreviewModalTag;