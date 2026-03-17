import { lazy, Suspense, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "rsuite";
import {
  SetStoreDevicesListSlice,
  type StoreDevicesListInterface,
} from "../../../stores/slices/Base/storeDevicesListSlice";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import {
  GetStoreDevicesListAPIHook,
  UpdateStoreDevicesListAPIHook,
} from "../../../customHooks/API/StoreDevices/StoreDevicesAPI";
import type { StoreListInterface } from "../../../stores/slices/Base/storeListSlice";
import { GetTemplateIdsAPIHook } from "../../../customHooks/API/Template/templateAPI";
import type { TemplateListInterface } from "../../../stores/slices/Base/templateListSlice";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const TextInputTitleTag = lazy(() => import("../../input/TextInputTitle"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);

const inputPrefix = "StoreDevicesManagement";

interface StoreDevicesManagementModalTagPropsInterface {
  showModal: boolean;
  selectedDevice?: StoreDevicesListInterface;
  selectedDeviceId: string;
  onClose: () => void;
}

function StoreDevicesManagementModalTag({
  showModal,
  selectedDevice,
  selectedDeviceId,
  onClose,
}: StoreDevicesManagementModalTagPropsInterface) {
  const dispatch = useDispatch();

  const [UpdateStoreDevicesListAPI] = UpdateStoreDevicesListAPIHook();
  const [GetStoreDevicesListAPI] = GetStoreDevicesListAPIHook();
  const [GetTemplateIdsAPI] = GetTemplateIdsAPIHook();

  const inputSlice: { value: Record<string, string> } = useSelector(
    (state: { inputSlice: { value: Record<string, string> } }) =>
      state.inputSlice,
  );

  const storeListSlice: { value: StoreListInterface[] } = useSelector(
    (state: { storeListSlice: { value: StoreListInterface[] } }) =>
      state.storeListSlice,
  );

  const templateListSlice: { value: TemplateListInterface[] } = useSelector(
    (state: { templateListSlice: { value: TemplateListInterface[] } }) =>
      state.templateListSlice,
  );

  const storeDevicesListSlice: { value: StoreDevicesListInterface[] } =
    useSelector(
      (state: {
        storeDevicesListSlice: { value: StoreDevicesListInterface[] };
      }) => state.storeDevicesListSlice,
    );

  const storeOptions = useMemo(() => {
    return (storeListSlice?.value ?? []).map(
      (singleStore: StoreListInterface) => {
        const storeId = String(singleStore?.id ?? "");
        const storeName = String(singleStore?.name ?? "");

        return {
          label: storeName || storeId,
          value: storeId,
        };
      },
    );
  }, [storeListSlice?.value]);

  const templateOptions = useMemo(() => {
    return (templateListSlice?.value ?? [])
      .slice()
      .sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? "")),
      )
      .map((singleTemplate: TemplateListInterface) => {
        const templateId = String(singleTemplate?.id ?? "");
        const templateName = String(singleTemplate?.name ?? "");

        return {
          label: templateName || templateId,
          value: templateId,
        };
      });
  }, [templateListSlice?.value]);

  useEffect(() => {
    if (!showModal || !selectedDevice) return;

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-id`,
        value: selectedDevice.id ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-store_id`,
        value: selectedDevice.store_id ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-description`,
        value: selectedDevice.description ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-hd_plc`,
        value: selectedDevice.hd_plc ?? "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-id_template`,
        value: selectedDevice.id_template ?? "",
      }),
    );
  }, [showModal, selectedDevice, dispatch]);

  useEffect(() => {
    GetStoreDevicesListAPI({ saveResponse: true, showLoader: true });
    GetTemplateIdsAPI({ saveResponse: true, showLoader: true });
  }, []);

  const HandleSaveButtonOnClick = () => {
    const id = inputSlice?.value?.[`${inputPrefix}-id`] ?? "";
    const store_id = inputSlice?.value?.[`${inputPrefix}-store_id`] ?? "";
    const description = inputSlice?.value?.[`${inputPrefix}-description`] ?? "";
    const hd_plc = inputSlice?.value?.[`${inputPrefix}-hd_plc`] ?? "";
    const id_template = inputSlice?.value?.[`${inputPrefix}-id_template`] ?? "";

    if (
      !id ||
      !store_id ||
      !description.trim() ||
      !hd_plc.trim() ||
      !id_template.trim()
    ) {
      return;
    }

    UpdateStoreDevicesListAPI({
      showLoader: true,
      showToast: true,
      data: {
        id,
        store_id,
        description: description.trim(),
        hd_plc: hd_plc.trim(),
        id_template: id_template.trim(),
      },
      EndCallback: () => {
        const updatedList = [...(storeDevicesListSlice?.value ?? [])].map(
          (singleDevice: StoreDevicesListInterface) => {
            if (String(singleDevice.id ?? "") !== String(id)) {
              return singleDevice;
            }

            return {
              ...singleDevice,
              store_id,
              description: description.trim(),
              hd_plc: hd_plc.trim(),
              id_template: id_template.trim(),
            };
          },
        );

        dispatch(SetStoreDevicesListSlice(updatedList));
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
          <Modal.Title>Modifica device</Modal.Title>

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
            {selectedDeviceId}
          </span>
        </div>
      </Modal.Header>

      <Modal.Body
        style={{
          padding: "18px",
        }}
      >
        <Suspense
          fallback={
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
          }
        >
          {selectedDevice ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "16px",
                  alignItems: "start",
                }}
              >
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
                    Device ID
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
                    Store
                  </span>

                  <SelectPickerTag
                    data={storeOptions}
                    cleanable={false}
                    searchable={true}
                    placeholder="Seleziona store"
                    value={
                      inputSlice?.value?.[`${inputPrefix}-store_id`]
                        ? String(inputSlice.value[`${inputPrefix}-store_id`])
                        : null
                    }
                    onChange={(value) => {
                      dispatch(
                        SetInputSlice({
                          id: `${inputPrefix}-store_id`,
                          value: value ? String(value) : "",
                        }),
                      );
                    }}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <TextInputTitleTag
                    idInput={`${inputPrefix}-description`}
                    title="Description"
                  />
                </div>

                <TextInputTitleTag
                  idInput={`${inputPrefix}-hd_plc`}
                  title="HD / PLC"
                />

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
                    Template
                  </span>

                  <SelectPickerTag
                    data={templateOptions}
                    cleanable={false}
                    searchable={true}
                    placeholder="Seleziona template"
                    value={
                      inputSlice?.value?.[`${inputPrefix}-id_template`]
                        ? String(inputSlice.value[`${inputPrefix}-id_template`])
                        : null
                    }
                    onChange={(value) => {
                      dispatch(
                        SetInputSlice({
                          id: `${inputPrefix}-id_template`,
                          value: value ? String(value) : "",
                        }),
                      );
                    }}
                    style={{ width: "100%" }}
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
                    !inputSlice?.value?.[`${inputPrefix}-store_id`] ||
                    !inputSlice?.value?.[
                      `${inputPrefix}-description`
                    ]?.trim() ||
                    !inputSlice?.value?.[`${inputPrefix}-hd_plc`]?.trim() ||
                    !inputSlice?.value?.[`${inputPrefix}-id_template`]?.trim()
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

export default StoreDevicesManagementModalTag;