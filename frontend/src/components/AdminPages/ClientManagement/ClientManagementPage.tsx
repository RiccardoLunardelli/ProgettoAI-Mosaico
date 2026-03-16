import { lazy, useEffect, useMemo, useState, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DeleteClientListAPIHook,
  GetClientListAPIHook,
} from "../../../customHooks/API/Client/ClientAPI";
import type { ClientListInterface } from "../../../stores/slices/Base/ClientListSlice";
import { SetClientListSlice } from "../../../stores/slices/Base/ClientListSlice";

const ClientManagementModalTag = lazy(() => import("./ClientManagementModal"));
const InsertClientModalTag = lazy(() => import("./InsertClientModal"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

interface ComponentStateInterface {
  selectedName: string;
  showModal: boolean;
  showDeleteModal: boolean;
  deletingClientName: string;
  showInsertModal: boolean;
}

function ClientManagementPageTag() {
  const dispatch = useDispatch();

  const [GetClientListAPI] = GetClientListAPIHook();
  const [DeleteClientListAPI] = DeleteClientListAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedName: "",
      showModal: false,
      showDeleteModal: false,
      deletingClientName: "",
      showInsertModal: false,
    },
  );

  const clientListSlice: { value: ClientListInterface[] } = useSelector(
    (state: { clientListSlice: { value: ClientListInterface[] } }) =>
      state.clientListSlice,
  );

  const selectedClient = useMemo(() => {
    return (clientListSlice?.value ?? []).find(
      (singleClient: ClientListInterface) =>
        String(
          (singleClient as ClientListInterface & { name?: string })?.name ?? "",
        ) === String(componentState.selectedName),
    );
  }, [clientListSlice?.value, componentState.selectedName]);

  const deletingClient = useMemo(() => {
    return (clientListSlice?.value ?? []).find(
      (singleClient: ClientListInterface) =>
        String(
          (singleClient as ClientListInterface & { name?: string })?.name ?? "",
        ) === String(componentState.deletingClientName),
    );
  }, [clientListSlice?.value, componentState.deletingClientName]);

  const HandleSelectClientOnClick = (singleClientName: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedName: singleClientName ?? "",
        showModal: true,
      };
    });
  };

  const HandleCloseModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showModal: false,
        selectedName: "",
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

  const HandleOpenDeleteModal = (singleClientName: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: true,
        deletingClientName: singleClientName ?? "",
      };
    });
  };

  const HandleCloseDeleteModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: false,
        deletingClientName: "",
      };
    });
  };

  const HandleConfirmDeleteClientOnClick = () => {
    const clientNameToDelete = componentState.deletingClientName ?? "";

    if (!clientNameToDelete) return;

    DeleteClientListAPI({
      showLoader: true,
      showToast: true,
      data: {
        name: clientNameToDelete,
      },
      EndCallback: () => {
        const newClientList = [...(clientListSlice?.value ?? [])].filter(
          (singleClient: ClientListInterface) =>
            String(
              (singleClient as ClientListInterface & { name?: string })?.name ??
                "",
            ) !== String(clientNameToDelete),
        );

        dispatch(SetClientListSlice(newClientList));

        setComponentState((previousStateVal: ComponentStateInterface) => {
          return {
            ...previousStateVal,
            showDeleteModal: false,
            deletingClientName: "",
            showModal:
              String(previousStateVal.selectedName) ===
              String(clientNameToDelete)
                ? false
                : previousStateVal.showModal,
            selectedName:
              String(previousStateVal.selectedName) ===
              String(clientNameToDelete)
                ? ""
                : previousStateVal.selectedName,
          };
        });
      },
    });
  };

  useEffect(() => {
    GetClientListAPI({ saveResponse: true, showLoader: true });
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
              Client Management
            </span>

            <div style={{ position: "absolute", right: 0 }}>
              <BasicButtonGenericTag textToSee="Inserisci Cliente" clickCallBack={HandleOpenInsertModal}/>
            </div>
          </div>

          {(clientListSlice?.value ?? []).length > 0 ? (
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
              {(clientListSlice?.value ?? [])
                .slice()
                .sort((a, b) =>
                  String(
                    (a as ClientListInterface & { name?: string })?.name ?? "",
                  ).localeCompare(
                    String(
                      (b as ClientListInterface & { name?: string })?.name ??
                        "",
                    ),
                  ),
                )
                .map((singleClient: ClientListInterface, index: number) => {
                  const clientName =
                    (singleClient as ClientListInterface & { name?: string })
                      ?.name ?? "";

                  const isSelected = componentState.selectedName === clientName;

                  return (
                    <div
                      key={`${clientName}-${index}`}
                      className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                      onClick={() => {
                        HandleSelectClientOnClick(clientName);
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
                          HandleOpenDeleteModal(clientName);
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
                          {clientName || `Client ${index + 1}`}
                        </span>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            lineHeight: "1.4",
                          }}
                        >
                          Clicca per modificare
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
                          Client
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
                })}
            </div>
          ) : (
            <span style={{ opacity: "60%" }}>Nessun client trovato</span>
          )}
        </div>
      </div>

      <Suspense fallback={<></>}>
        <ClientManagementModalTag
          showModal={componentState.showModal}
          selectedClient={selectedClient}
          selectedName={componentState.selectedName}
          onClose={HandleCloseModal}
        />
      </Suspense>

      <Suspense fallback={<></>}>
        <InsertClientModalTag
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
                Elimina client
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
                  {deletingClient?.name ?? "questo client"}
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
                onClick={HandleConfirmDeleteClientOnClick}
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

export default ClientManagementPageTag;
