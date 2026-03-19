import { lazy, useEffect, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  SetUserListSlice,
  type UserListInterface,
} from "../../../stores/slices/Base/userListSlice";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import { UpdateUserListAPIHook } from "../../../customHooks/API/UserList/userListAPI";
import { Modal } from "rsuite";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const PasswordInputTitleTag = lazy(
  () => import("../../input/PasswordInputTitle"),
);
const TextInputTitleTag = lazy(() => import("../../input/TextInputTitle"));
const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

const ROLE_OPTIONS = [
  { label: "Admin", value: "1" },
  { label: "Utente", value: "2" },
];

const inputPrefix = "UserManagement";

interface UserManagementModalTagPropsInterface {
  showModal: boolean;
  selectedUser?: UserListInterface;
  selectedId: string;
  onClose: () => void;
}

function UserManagementModalTag({
  showModal,
  selectedUser,
  selectedId,
  onClose,
}: UserManagementModalTagPropsInterface) {
  const dispatch = useDispatch();

  const [UpdateUserListAPI] = UpdateUserListAPIHook();

  const inputSlice: { value: Record<string, string> } = useSelector(
    (state: { inputSlice: { value: Record<string, string> } }) =>
      state.inputSlice,
  );

  const userListSlice: { value: UserListInterface[] } = useSelector(
    (state: { userListSlice: { value: UserListInterface[] } }) =>
      state.userListSlice,
  );

  useEffect(() => {
    if (!showModal || !selectedUser) return;

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-id`,
        value: selectedUser.id ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-email`,
        value: selectedUser.email ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-name`,
        value: selectedUser.name ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-created_at`,
        value: selectedUser.created_at ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-password`,
        value: selectedUser.password ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-role`,
        value:
          selectedUser.role !== undefined && selectedUser.role !== null
            ? String(selectedUser.role)
            : "",
      }),
    );
  }, [showModal, selectedUser, dispatch]);

  const HandleSaveButtonOnClick = () => {
    const user_id = inputSlice?.value?.[`${inputPrefix}-id`] ?? "";
    const email = inputSlice?.value?.[`${inputPrefix}-email`] ?? "";
    const name = inputSlice?.value?.[`${inputPrefix}-name`] ?? "";
    const password = inputSlice?.value?.[`${inputPrefix}-password`] ?? "";
    const role = inputSlice?.value?.[`${inputPrefix}-role`] ?? "";
    const parsedRole = parseInt(role.replaceAll(" ", ""));

    const currentUser = (userListSlice?.value ?? []).find((singleUser: UserListInterface) => singleUser.id == user_id)

    const isSamePassword = currentUser?.password == password

    UpdateUserListAPI({
      showLoader: true,
      showToast: true,
      data: {
        user_id,
        email,
        name,
        password: isSamePassword ? null : password,
        role: parseInt(role.replaceAll(" ", "")),
      },
      EndCallback: () => {
        const list = [...(userListSlice?.value ?? [])];

        const index = list.findIndex((u) => String(u.id) === String(user_id));

        if (index !== -1) {
          list[index] = {
            ...list[index],
            email,
            name,
            password,
            role: parsedRole,
          };
        }

        dispatch(SetUserListSlice(list));
      },
    });
  };

  if (!showModal) return <></>;

  return (
    <Modal
      open={showModal}
      onClose={onClose}
      size="md"
      backdrop="static"
      overflow={true}
    >
      <Modal.Header>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Modal.Title>Modifica utente</Modal.Title>

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
            {selectedId}
          </span>
        </div>
      </Modal.Header>

      <Modal.Body
        style={{
          padding: "18px",
        }}
      >
        <Suspense
          fallback={""}
        >
          {selectedUser ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "16px",
                  alignItems: "start",
                }}
              >
                <TextInputTitleTag
                  idInput={`${inputPrefix}-id`}
                  title="User ID"
                  disabled
                />

                <TextInputTitleTag
                  idInput={`${inputPrefix}-name`}
                  title="Name"
                />

                <div style={{ gridColumn: "1 / -1" }}>
                  <TextInputTitleTag
                    idInput={`${inputPrefix}-email`}
                    title="Email"
                  />
                </div>

                <PasswordInputTitleTag
                  idInput={`${inputPrefix}-password`}
                  title="Password"
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    height: "100%",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Role
                  </span>

                  <SelectPickerTag
                    data={ROLE_OPTIONS}
                    cleanable={false}
                    searchable={false}
                    placeholder="Seleziona ruolo"
                    container={() => document.body}
                    popupClassName="user-role-picker"
                    value={
                      inputSlice?.value?.[`${inputPrefix}-role`]
                        ? String(inputSlice.value[`${inputPrefix}-role`])
                        : null
                    }
                    onChange={(value) => {
                      dispatch(
                        SetInputSlice({
                          id: `${inputPrefix}-role`,
                          value: value ? String(value) : "",
                        }),
                      );
                    }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <TextInputTitleTag
                    idInput={`${inputPrefix}-created_at`}
                    title="Created At"
                    disabled
                  />
                </div>
              </div>

              <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end"}}>
                <BasicButtonGenericTag
                  textToSee="Salva"
                  clickCallBack={HandleSaveButtonOnClick}
                />
              </div>
            </>
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
        </Suspense>
      </Modal.Body>
    </Modal>
  );
}

export default UserManagementModalTag;
