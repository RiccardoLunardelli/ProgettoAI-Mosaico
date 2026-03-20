import { lazy, useMemo, useState, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { StoreListInterface } from "../../../stores/slices/Base/storeListSlice";
import { SetStoreListSlice } from "../../../stores/slices/Base/storeListSlice";
import { DeleteStoreListAPIHook } from "../../../customHooks/API/Store/StoreAPI";
import type { ClientListInterface } from "../../../stores/slices/Base/clientListSlice";

const StoreManagementModalTag = lazy(() => import("./StoreManagementModal"));
const InsertStoreManagementModalTag = lazy(
  () => import("./InsertStoreManagementModal"),
);

interface ComponentStateInterface {
  selectedStoreId: string;
  showModal: boolean;
  showDeleteModal: boolean;
  deletingStoreId: string;
  showInsertModal: boolean;
  searchValue: string;
  selectedClientId: string;
}

function StoreManagementPageTag() {
  const dispatch = useDispatch();

  const [DeleteStoreListAPI] = DeleteStoreListAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedStoreId: "",
      showModal: false,
      showDeleteModal: false,
      deletingStoreId: "",
      showInsertModal: false,
      searchValue: "",
      selectedClientId: "",
    },
  );

  const storeListSlice: { value: StoreListInterface[] } = useSelector(
    (state: { storeListSlice: { value: StoreListInterface[] } }) =>
      state.storeListSlice,
  );

  const clientListSlice: { value: ClientListInterface[] } = useSelector(
    (state: { clientListSlice: { value: ClientListInterface[] } }) =>
      state.clientListSlice,
  );

  const clientNameById = useMemo(() => {
    const map: Record<string, string> = {};

    (clientListSlice?.value ?? []).forEach(
      (singleClient: ClientListInterface) => {
        const clientId = String(
          (
            singleClient as ClientListInterface & {
              id?: string;
              client_id?: string;
            }
          )?.id ??
            (
              singleClient as ClientListInterface & {
                id?: string;
                client_id?: string;
              }
            )?.client_id ??
            "",
        );

        const clientName = String(
          (singleClient as ClientListInterface & { name?: string })?.name ?? "",
        );

        if (clientId) {
          map[clientId] = clientName || clientId;
        }
      },
    );

    return map;
  }, [clientListSlice?.value]);

  const clientOptions = useMemo(() => {
    return (clientListSlice?.value ?? [])
      .map((singleClient: ClientListInterface) => {
        const clientId = String(
          (
            singleClient as ClientListInterface & {
              id?: string;
              client_id?: string;
            }
          )?.id ??
            (
              singleClient as ClientListInterface & {
                id?: string;
                client_id?: string;
              }
            )?.client_id ??
            "",
        );

        const clientName = String(
          (singleClient as ClientListInterface & { name?: string })?.name ?? "",
        );

        return {
          id: clientId,
          name: clientName || clientId,
        };
      })
      .filter((singleClient) => singleClient.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clientListSlice?.value]);

  const filteredStoreList = useMemo(() => {
    const normalizedSearch = String(componentState.searchValue ?? "")
      .trim()
      .toLowerCase();

    return [...(storeListSlice?.value ?? [])]
      .filter((singleStore: StoreListInterface) => {
        const storeId = String(singleStore?.id ?? "");
        const storeName = String(singleStore?.name ?? "");
        const clientId = String(singleStore?.client_id ?? "");
        const clientName = String(clientNameById[clientId] ?? "");

        const matchesSearch =
          !normalizedSearch ||
          storeName.toLowerCase().includes(normalizedSearch) ||
          storeId.toLowerCase().includes(normalizedSearch) ||
          clientId.toLowerCase().includes(normalizedSearch) ||
          clientName.toLowerCase().includes(normalizedSearch);

        const matchesClient =
          !String(componentState.selectedClientId ?? "") ||
          String(componentState.selectedClientId) === clientId;

        return matchesSearch && matchesClient;
      })
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [
    storeListSlice?.value,
    componentState.searchValue,
    componentState.selectedClientId,
    clientNameById,
  ]);

  const selectedStore = useMemo(() => {
    return (storeListSlice?.value ?? []).find(
      (singleStore: StoreListInterface) =>
        String(singleStore.id ?? "") ===
        String(componentState.selectedStoreId ?? ""),
    );
  }, [storeListSlice?.value, componentState.selectedStoreId]);

  const deletingStore = useMemo(() => {
    return (storeListSlice?.value ?? []).find(
      (singleStore: StoreListInterface) =>
        String(singleStore.id ?? "") ===
        String(componentState.deletingStoreId ?? ""),
    );
  }, [storeListSlice?.value, componentState.deletingStoreId]);

  const HandleSelectStoreOnClick = (singleStoreId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedStoreId: singleStoreId ?? "",
        showModal: true,
      };
    });
  };

  const HandleCloseModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showModal: false,
        selectedStoreId: "",
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

  const HandleOpenDeleteModal = (singleStoreId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: true,
        deletingStoreId: singleStoreId ?? "",
      };
    });
  };

  const HandleCloseDeleteModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: false,
        deletingStoreId: "",
      };
    });
  };

  const HandleConfirmDeleteStoreOnClick = () => {
    const storeIdToDelete = componentState.deletingStoreId ?? "";

    const storeToDelete = (storeListSlice?.value ?? []).find(
      (singleStore: StoreListInterface) =>
        String(singleStore.id ?? "") === String(storeIdToDelete),
    );

    const storeName = storeToDelete?.name ?? "";

    if (!storeName) return;

    DeleteStoreListAPI({
      showLoader: true,
      showToast: true,
      data: {
        name: storeName,
      },
      EndCallback: () => {
        const newStoreList = [...(storeListSlice?.value ?? [])].filter(
          (singleStore: StoreListInterface) =>
            String(singleStore.id ?? "") !== String(storeIdToDelete),
        );

        dispatch(SetStoreListSlice(newStoreList));

        setComponentState((previousStateVal: ComponentStateInterface) => {
          return {
            ...previousStateVal,
            showDeleteModal: false,
            deletingStoreId: "",
            showModal:
              String(previousStateVal.selectedStoreId) ===
              String(storeIdToDelete)
                ? false
                : previousStateVal.showModal,
            selectedStoreId:
              String(previousStateVal.selectedStoreId) ===
              String(storeIdToDelete)
                ? ""
                : previousStateVal.selectedStoreId,
          };
        });
      },
    });
  };

  const HandleResetFilters = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        searchValue: "",
        selectedClientId: "",
      };
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
              Store Management
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
                Inserisci Store
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              marginBottom: "18px",
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <input
              value={componentState.searchValue}
              onChange={(e) => {
                const value = e.target.value ?? "";

                setComponentState((previousStateVal) => {
                  return {
                    ...previousStateVal,
                    searchValue: value,
                  };
                });
              }}
              placeholder="Cerca per nome store, id o cliente..."
              style={{
                height: "40px",
                minWidth: "260px",
                flex: 1,
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "14px",
                backgroundColor: "#ffffff",
                color: "#111827",
              }}
            />

            <select
              value={componentState.selectedClientId}
              onChange={(e) => {
                const value = e.target.value ?? "";

                setComponentState((previousStateVal) => {
                  return {
                    ...previousStateVal,
                    selectedClientId: value,
                  };
                });
              }}
              style={{
                height: "40px",
                minWidth: "220px",
                padding: "0 12px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "14px",
                backgroundColor: "#ffffff",
                color: "#111827",
                cursor: "pointer",
              }}
            >
              <option value="">Tutti i clienti</option>

              {clientOptions.map((singleClient) => {
                return (
                  <option key={singleClient.id} value={singleClient.id}>
                    {singleClient.name}
                  </option>
                );
              })}
            </select>

            <button
              onClick={HandleResetFilters}
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
              Reset
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              Risultati: {filteredStoreList.length} /{" "}
              {(storeListSlice?.value ?? []).length}
            </span>
          </div>
          <div style={{overflow: "auto"}}>
            {filteredStoreList.length > 0 ? (
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
                {filteredStoreList.map(
                  (singleStore: StoreListInterface, index: number) => {
                    const isSelected =
                      String(componentState.selectedStoreId ?? "") ===
                      String(singleStore?.id ?? "");

                    return (
                      <div
                        key={String(
                          singleStore?.id ?? `${singleStore?.name}-${index}`,
                        )}
                        className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                        onClick={() => {
                          HandleSelectStoreOnClick(
                            String(singleStore.id ?? ""),
                          );
                        }}
                        style={{
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          boxSizing: "border-box",
                          minHeight: "150px",
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
                            HandleOpenDeleteModal(String(singleStore.id ?? ""));
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
                            {singleStore.name || `Store ${index + 1}`}
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
                            Cliente:{" "}
                            {clientNameById[
                              String(singleStore.client_id ?? "")
                            ] ??
                              singleStore.client_id ??
                              "-"}
                          </span>

                          <span
                            style={{
                              fontSize: "12px",
                              color: "#9ca3af",
                              lineHeight: "1.4",
                            }}
                          >
                            ID: {singleStore.id ?? "-"}
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
                            Store
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
            ) : (storeListSlice?.value ?? []).length > 0 ? (
              <span style={{ opacity: "60%" }}>
                Nessuno store trovato con i filtri selezionati
              </span>
            ) : (
              <span style={{ opacity: "60%" }}>Nessuno store trovato</span>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={<></>}>
        <StoreManagementModalTag
          showModal={componentState.showModal}
          selectedStore={selectedStore}
          selectedStoreId={componentState.selectedStoreId}
          onClose={HandleCloseModal}
        />
      </Suspense>

      <Suspense fallback={<></>}>
        <InsertStoreManagementModalTag
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
                Elimina store
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
                  {deletingStore?.name ?? "questo store"}
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
                onClick={HandleConfirmDeleteStoreOnClick}
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

export default StoreManagementPageTag;
