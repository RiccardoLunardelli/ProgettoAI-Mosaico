import { lazy, Suspense, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "rsuite";
import {
  SetStoreListSlice,
  type StoreListInterface,
} from "../../../stores/slices/Base/storeListSlice";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import { UpdateStoreListAPIHook } from "../../../customHooks/API/Store/StoreAPI";
import type { ClientListInterface } from "../../../stores/slices/Base/clientListSlice";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const TextInputTitleTag = lazy(() => import("../../input/TextInputTitle"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);

const inputPrefix = "StoreManagement";

interface StoreManagementModalTagPropsInterface {
  showModal: boolean;
  selectedStore?: StoreListInterface;
  selectedStoreId: string;
  onClose: () => void;
}

function StoreManagementModalTag({
  showModal,
  selectedStore,
  selectedStoreId,
  onClose,
}: StoreManagementModalTagPropsInterface) {
  const dispatch = useDispatch();

  const [UpdateStoreListAPI] = UpdateStoreListAPIHook();

  const inputSlice: { value: Record<string, string> } = useSelector(
    (state: { inputSlice: { value: Record<string, string> } }) =>
      state.inputSlice,
  );

  const storeListSlice: { value: StoreListInterface[] } = useSelector(
    (state: { storeListSlice: { value: StoreListInterface[] } }) =>
      state.storeListSlice,
  );

  const clientListSlice: { value: ClientListInterface[] } = useSelector(
    (state: { clientListSlice: { value: ClientListInterface[] } }) =>
      state.clientListSlice,
  );

  const clientOptions = useMemo(() => {
    return (clientListSlice?.value ?? []).map(
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

        return {
          label: clientName || clientId,
          value: clientId,
        };
      },
    );
  }, [clientListSlice?.value]);

  useEffect(() => {
    if (!showModal || !selectedStore) return;

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-id`,
        value: selectedStore.id ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-client_id`,
        value: selectedStore.client_id ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-name`,
        value: selectedStore.name ?? "",
      }),
    );
  }, [showModal, selectedStore, dispatch]);

  const HandleSaveButtonOnClick = () => {
    const id = inputSlice?.value?.[`${inputPrefix}-id`] ?? "";
    const client_id = inputSlice?.value?.[`${inputPrefix}-client_id`] ?? "";
    const new_name = inputSlice?.value?.[`${inputPrefix}-name`] ?? "";
    const original_name = selectedStore?.name ?? "";

    if (!client_id || !original_name || !new_name.trim()) return;

    UpdateStoreListAPI({
      showLoader: true,
      showToast: true,
      data: {
        id,
        client_id,
        name: original_name,
        new_name: new_name.trim(),
      },
      EndCallback: () => {
        const list = [...(storeListSlice?.value ?? [])];

        const index = list.findIndex((singleStore: StoreListInterface) => {
          if (id) {
            return String(singleStore.id ?? "") === String(id);
          }

          return (
            String(singleStore.client_id ?? "") ===
              String(selectedStore?.client_id ?? "") &&
            String(singleStore.name ?? "") === String(original_name)
          );
        });

        if (index !== -1) {
          list[index] = {
            ...list[index],
            client_id,
            name: new_name.trim(),
          };
        }

        dispatch(SetStoreListSlice(list));
        onClose();
      },
    });
  };

  return (
    <Modal open={showModal} onClose={onClose} size="md" overflow={true}>
      <Modal.Header>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Modal.Title>Modifica store</Modal.Title>

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
            {selectedStoreId}
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
          {selectedStore ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "16px",
                  alignItems: "start",
                }}
              >
                {/* STORE ID */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Store ID
                  </span>

                  <input
                    value={inputSlice?.value?.[`${inputPrefix}-id`] ?? ""}
                    disabled
                    style={{
                      height: "38px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      padding: "0 10px",
                      fontSize: "13px",
                      backgroundColor: "#f9fafb",
                      color: "#6b7280",
                    }}
                  />
                </div>

                {/* CLIENTE */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Cliente
                  </span>

                  <SelectPickerTag
                    data={clientOptions}
                    cleanable={false}
                    searchable={true}
                    placeholder="Seleziona client"
                    value={
                      inputSlice?.value?.[`${inputPrefix}-client_id`]
                        ? String(inputSlice.value[`${inputPrefix}-client_id`])
                        : null
                    }
                    onChange={(value) => {
                      dispatch(
                        SetInputSlice({
                          id: `${inputPrefix}-client_id`,
                          value: value ? String(value) : "",
                        }),
                      );
                    }}
                    style={{ width: "100%" }}
                  />
                </div>

                {/* STORE NAME */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <TextInputTitleTag
                    idInput={`${inputPrefix}-name`}
                    title="Store Name"
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <BasicButtonGenericTag
                  textToSee="Salva"
                  clickCallBack={HandleSaveButtonOnClick}
                  disabledButton={
                    !inputSlice?.value?.[`${inputPrefix}-client_id`] ||
                    !inputSlice?.value?.[`${inputPrefix}-name`]?.trim()
                  }
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

export default StoreManagementModalTag;
