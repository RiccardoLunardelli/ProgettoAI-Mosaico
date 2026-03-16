import { lazy, useMemo, useState, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  SetStoreDevicesListSlice,
  type StoreDevicesListInterface,
} from "../../../stores/slices/Base/storeDevicesListSlice";
import { DeleteStoreDevicesListAPIHook } from "../../../customHooks/API/StoreDevices/StoreDevicesAPI";
import type { StoreListInterface } from "../../../stores/slices/Base/storeListSlice";

const StoreDevicesManagementModalTag = lazy(
  () => import("./StoreDevicesManagementModal"),
);
const InsertStoreDevicesManagementModalTag = lazy(
  () => import("./InsertStoreDevicesManagementModal"),
);

interface ComponentStateInterface {
  selectedDeviceId: string;
  showModal: boolean;
  showDeleteModal: boolean;
  deletingDeviceId: string;
  showInsertModal: boolean;
}

function StoreDevicesManagementPageTag() {
  const dispatch = useDispatch();

  const [DeleteStoreDevicesListAPI] = DeleteStoreDevicesListAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedDeviceId: "",
      showModal: false,
      showDeleteModal: false,
      deletingDeviceId: "",
      showInsertModal: false,
    },
  );

  const storeDevicesListSlice: { value: StoreDevicesListInterface[] } =
    useSelector(
      (state: {
        storeDevicesListSlice: { value: StoreDevicesListInterface[] };
      }) => state.storeDevicesListSlice,
    );

  const storeListSlice: { value: StoreListInterface[] } = useSelector(
    (state: { storeListSlice: { value: StoreListInterface[] } }) =>
      state.storeListSlice,
  );

  const selectedDevice = useMemo(() => {
    return (storeDevicesListSlice?.value ?? []).find(
      (singleDevice: StoreDevicesListInterface) =>
        String(singleDevice.id ?? "") ===
        String(componentState.selectedDeviceId ?? ""),
    );
  }, [storeDevicesListSlice?.value, componentState.selectedDeviceId]);

  const deletingDevice = useMemo(() => {
    return (storeDevicesListSlice?.value ?? []).find(
      (singleDevice: StoreDevicesListInterface) =>
        String(singleDevice.id ?? "") ===
        String(componentState.deletingDeviceId ?? ""),
    );
  }, [storeDevicesListSlice?.value, componentState.deletingDeviceId]);

  const storeNameById = useMemo(() => {
    const map: Record<string, string> = {};

    (storeListSlice?.value ?? []).forEach((singleStore: StoreListInterface) => {
      const storeId = String(singleStore?.id ?? "");
      const storeName = String(singleStore?.name ?? "");

      if (storeId) {
        map[storeId] = storeName || storeId;
      }
    });

    return map;
  }, [storeListSlice?.value]);

  const HandleSelectDeviceOnClick = (singleDeviceId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedDeviceId: singleDeviceId ?? "",
        showModal: true,
      };
    });
  };

  const HandleCloseModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showModal: false,
        selectedDeviceId: "",
      };
    });
  };

  const HandleOpenInsertModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showInsertModal: true,
      };
    });
  };

  const HandleCloseInsertModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showInsertModal: false,
      };
    });
  };

  const HandleOpenDeleteModal = (singleDeviceId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: true,
        deletingDeviceId: singleDeviceId ?? "",
      };
    });
  };

  const HandleCloseDeleteModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: false,
        deletingDeviceId: "",
      };
    });
  };

  const HandleConfirmDeleteDeviceOnClick = () => {
    const deviceIdToDelete = componentState.deletingDeviceId ?? "";

    if (!deviceIdToDelete) return;

    DeleteStoreDevicesListAPI({
      showLoader: true,
      showToast: true,
      data: {
        id: deviceIdToDelete,
      },
      EndCallback: () => {
        const newDeviceList = [...(storeDevicesListSlice?.value ?? [])].filter(
          (singleDevice: StoreDevicesListInterface) =>
            String(singleDevice.id ?? "") !== String(deviceIdToDelete),
        );

        dispatch(SetStoreDevicesListSlice(newDeviceList));

        setComponentState((previousStateVal: ComponentStateInterface) => {
          return {
            ...previousStateVal,
            showDeleteModal: false,
            deletingDeviceId: "",
            showModal:
              String(previousStateVal.selectedDeviceId) ===
              String(deviceIdToDelete)
                ? false
                : previousStateVal.showModal,
            selectedDeviceId:
              String(previousStateVal.selectedDeviceId) ===
              String(deviceIdToDelete)
                ? ""
                : previousStateVal.selectedDeviceId,
          };
        });
      },
    });
  };

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
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "18px",
              minHeight: "40px",
            }}
          >
            <span
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "#111827",
                textAlign: "center",
              }}
            >
              Store Devices Management
            </span>

            <div style={{ position: "absolute", right: 0 }}>
              <button
                onClick={HandleOpenInsertModal}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "1px solid #477dda",
                  backgroundColor: "#477dda",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Inserisci Device
              </button>
            </div>
          </div>

          {(storeDevicesListSlice?.value ?? []).length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px",
                width: "100%",
                paddingBottom: "25px",
                boxSizing: "border-box",
              }}
            >
              {(storeDevicesListSlice?.value ?? [])
                .slice()
                .sort((a, b) =>
                  String(a.description ?? "").localeCompare(
                    String(b.description ?? ""),
                  ),
                )
                .map(
                  (singleDevice: StoreDevicesListInterface, index: number) => {
                    const isSelected =
                      String(componentState.selectedDeviceId ?? "") ===
                      String(singleDevice?.id ?? "");

                    return (
                      <div
                        key={String(singleDevice?.id ?? `device-${index}`)}
                        className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                        onClick={() => {
                          HandleSelectDeviceOnClick(
                            String(singleDevice.id ?? ""),
                          );
                        }}
                        style={{
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          boxSizing: "border-box",
                          minHeight: "180px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          overflow: "hidden",
                          transition: "all 0.18s ease",
                          backgroundColor: "#ffffff",
                          position: "relative",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            HandleOpenDeleteModal(
                              String(singleDevice.id ?? ""),
                            );
                          }}
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            fontSize: "20px",
                            color: "#ef4444",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          delete
                        </span>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            minWidth: 0,
                            paddingRight: "28px",
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
                            {singleDevice.description || `Device ${index + 1}`}
                          </span>

                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              lineHeight: "1.4",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            Store:{" "}
                            {storeNameById[
                              String(singleDevice.store_id ?? "")
                            ] ??
                              singleDevice.store_id ??
                              "-"}
                          </span>

                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              lineHeight: "1.4",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            HD/PLC: {singleDevice.hd_plc ?? "-"}
                          </span>

                          <span
                            style={{
                              fontSize: "12px",
                              color: "#9ca3af",
                              lineHeight: "1.4",
                            }}
                          >
                            Template ID: {singleDevice.id_template ?? "-"}
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
                            Device
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
            <span style={{ opacity: "60%" }}>Nessun device trovato</span>
          )}
        </div>
      </div>

      <Suspense fallback={<></>}>
        <StoreDevicesManagementModalTag
          showModal={componentState.showModal}
          selectedDevice={selectedDevice}
          selectedDeviceId={componentState.selectedDeviceId}
          onClose={HandleCloseModal}
        />
      </Suspense>

      <Suspense fallback={<></>}>
        <InsertStoreDevicesManagementModalTag
          showModal={componentState.showInsertModal}
          onClose={HandleCloseInsertModal}
        />
      </Suspense>

      {componentState.showDeleteModal ? (
        <div
          onClick={HandleCloseDeleteModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            zIndex: 10000,
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
              width: "min(420px, 92vw)",
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.20)",
              padding: "22px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Elimina device
              </span>

              <span
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                Sei sicuro di voler eliminare{" "}
                <span style={{ fontWeight: 600, color: "#111827" }}>
                  {deletingDevice?.description ?? "questo device"}
                </span>
                ?
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={HandleCloseDeleteModal}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Annulla
              </button>

              <button
                onClick={HandleConfirmDeleteDeviceOnClick}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "1px solid #dc2626",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Sì, elimina
              </button>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export default StoreDevicesManagementPageTag;
