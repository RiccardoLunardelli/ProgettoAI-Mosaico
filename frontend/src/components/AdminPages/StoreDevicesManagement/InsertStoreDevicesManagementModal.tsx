import { lazy, Suspense, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "rsuite";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import {
  GetStoreDevicesListAPIHook,
  InsertStoreDevicesListAPIHook,
} from "../../../customHooks/API/StoreDevices/StoreDevicesAPI";
import type { StoreListInterface } from "../../../stores/slices/Base/storeListSlice";
import { GetTemplateIdsAPIHook } from "../../../customHooks/API/Template/templateAPI";
import type { TemplateListInterface } from "../../../stores/slices/Base/templateListSlice";

const TextInputTitleTag = lazy(() => import("../../input/TextInputTitle"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);

const inputPrefix = "InsertStoreDevicesManagement";

interface InsertStoreDevicesManagementModalTagPropsInterface {
  showModal: boolean;
  onClose: () => void;
}

function InsertStoreDevicesManagementModalTag({
  showModal,
  onClose,
}: InsertStoreDevicesManagementModalTagPropsInterface) {
  const dispatch = useDispatch();

  const [InsertStoreDevicesListAPI] = InsertStoreDevicesListAPIHook();
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
    if (!showModal) return;

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-store_id`,
        value: "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-description`,
        value: "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-hd_plc`,
        value: "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-id_template`,
        value: "",
      }),
    );
  }, [showModal, dispatch]);

  useEffect(() => {
    GetTemplateIdsAPI({ saveResponse: true, showLoader: false });
  }, []);

  const HandleInsertButtonOnClick = () => {
    const store_id = inputSlice?.value?.[`${inputPrefix}-store_id`] ?? "";
    const description =
      inputSlice?.value?.[`${inputPrefix}-description`] ?? "";
    const hd_plc = inputSlice?.value?.[`${inputPrefix}-hd_plc`] ?? "";
    const id_template =
      inputSlice?.value?.[`${inputPrefix}-id_template`] ?? "";

    if (
      !store_id ||
      !description.trim() ||
      !hd_plc.trim() ||
      !id_template.trim()
    ) {
      return;
    }

    InsertStoreDevicesListAPI({
      showLoader: true,
      showToast: true,
      data: {
        store_id,
        description: description.trim(),
        hd_plc: hd_plc.trim(),
        id_template: id_template.trim(),
      },
      EndCallback: () => {
        GetStoreDevicesListAPI({
          showLoader: false,
          saveResponse: true,
          EndCallback: () => {
            onClose();
          },
        });
      },
    });
  };

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
          <Modal.Title>Inserisci device</Modal.Title>

          <span
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "4px",
            }}
          >
            Crea un nuovo device
          </span>
        </div>
      </Modal.Header>

      <Modal.Body
        style={{
          padding: "18px",
        }}
      >
        <Suspense fallback={<></>}>
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
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <BasicButtonGenericTag
              textToSee="Inserisci"
              clickCallBack={HandleInsertButtonOnClick}
              disabledButton={
                !inputSlice?.value?.[`${inputPrefix}-store_id`] ||
                !inputSlice?.value?.[`${inputPrefix}-description`]?.trim() ||
                !inputSlice?.value?.[`${inputPrefix}-hd_plc`]?.trim() ||
                !inputSlice?.value?.[`${inputPrefix}-id_template`]?.trim()
              }
            />
          </div>
        </Suspense>
      </Modal.Body>
    </Modal>
  );
}

export default InsertStoreDevicesManagementModalTag;