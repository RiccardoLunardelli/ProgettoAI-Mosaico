import { lazy, useEffect, useMemo, useState, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DeleteUserListAPIHook,
  GetUserListAPIHook,
} from "../../../customHooks/API/UserList/userListAPI";
import type { UserListInterface } from "../../../stores/slices/Base/userListSlice";
import { SetUserListSlice } from "../../../stores/slices/Base/userListSlice";

const UserManagementModalTag = lazy(() => import("./UserManagementModal"));

interface ComponentStateInterface {
  selectedId: string;
  showModal: boolean;
  showDeleteModal: boolean;
  deletingUserId: string;
}

function UserManagementPageTag() {
  const dispatch = useDispatch();

  const [GetUserListAPI] = GetUserListAPIHook();
  const [DeleteUserListAPI] = DeleteUserListAPIHook();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      selectedId: "",
      showModal: false,
      showDeleteModal: false,
      deletingUserId: "",
    },
  );

  const userListSlice: { value: UserListInterface[] } = useSelector(
    (state: { userListSlice: { value: UserListInterface[] } }) =>
      state.userListSlice,
  );

  const selectedUser = useMemo(() => {
    return (userListSlice?.value ?? []).find(
      (singleUser: UserListInterface) =>
        singleUser.id === componentState.selectedId,
    );
  }, [userListSlice?.value, componentState.selectedId]);

  const deletingUser = useMemo(() => {
    return (userListSlice?.value ?? []).find(
      (singleUser: UserListInterface) =>
        singleUser.id === componentState.deletingUserId,
    );
  }, [userListSlice?.value, componentState.deletingUserId]);

  const HandleSelectUserOnClick = (singleUserId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selectedId: singleUserId ?? "",
        showModal: true,
      };
    });
  };

  const HandleCloseModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showModal: false,
        selectedId: "",
      };
    });
  };

  const HandleOpenDeleteModal = (singleUserId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: true,
        deletingUserId: singleUserId ?? "",
      };
    });
  };

  const HandleCloseDeleteModal = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showDeleteModal: false,
        deletingUserId: "",
      };
    });
  };

  const HandleConfirmDeleteUserOnClick = () => {
    const userIdToDelete = componentState.deletingUserId ?? "";

    if (!userIdToDelete) return;

    
    DeleteUserListAPI({
      showLoader: true,
      showToast: true,
      data: {
        user_id: userIdToDelete,
      },
      EndCallback: () => {
        const newUserList = [...(userListSlice?.value ?? [])].filter(
          (singleUser: UserListInterface) =>
            String(singleUser.id) !== String(userIdToDelete),
        );

        dispatch(
          SetUserListSlice(newUserList),
        );

        setComponentState((previousStateVal: ComponentStateInterface) => {
          return {
            ...previousStateVal,
            showDeleteModal: false,
            deletingUserId: "",
            showModal:
              String(previousStateVal.selectedId) === String(userIdToDelete)
                ? false
                : previousStateVal.showModal,
            selectedId:
              String(previousStateVal.selectedId) === String(userIdToDelete)
                ? ""
                : previousStateVal.selectedId,
          };
        });
      },
    });

    
  };

  useEffect(() => {
    GetUserListAPI({ saveResponse: true, showLoader: true });
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
          <span
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "18px",
            }}
          >
            User Management
          </span>

          {(userListSlice?.value ?? []).length > 0 ? (
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
              {(userListSlice?.value ?? [])
                .slice()
                .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
                .map((singleUser: UserListInterface) => {
                  const isSelected =
                    componentState.selectedId === (singleUser?.id ?? "");

                  return (
                    <div
                      key={singleUser?.id ?? ""}
                      className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                      onClick={() => {
                        HandleSelectUserOnClick(singleUser.id);
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
                          HandleOpenDeleteModal(singleUser.id);
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
                          {singleUser.name}
                        </span>

                        <span
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            lineHeight: "1.4",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {singleUser.email}
                        </span>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            lineHeight: "1.4",
                          }}
                        >
                          ID: {singleUser.id}
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
                          Role:{" "}
                          {String(singleUser.role) === "1" ? "Admin" : "Utente"}
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
            <span style={{ opacity: "60%" }}>Nessun utente trovato</span>
          )}
        </div>
      </div>

      <Suspense fallback={<></>}>
        <UserManagementModalTag
          showModal={componentState.showModal}
          selectedUser={selectedUser}
          selectedId={componentState.selectedId}
          onClose={HandleCloseModal}
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
                Elimina utente
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
                  {deletingUser?.name ?? deletingUser?.email ?? "questo utente"}
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
                onClick={HandleConfirmDeleteUserOnClick}
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

export default UserManagementPageTag;