import { lazy, Suspense, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "rsuite";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import {
  GetStoreListAPIHook,
  InsertStoreListAPIHook,
} from "../../../customHooks/API/Store/StoreAPI";
import type { ClientListInterface } from "../../../stores/slices/Base/clientListSlice";

const TextInputTitleTag = lazy(() => import("../../input/TextInputTitle"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

const inputPrefix = "InsertStoreManagement";

interface InsertStoreManagementModalTagPropsInterface {
  showModal: boolean;
  onClose: () => void;
}

function InsertStoreManagementModalTag({
  showModal,
  onClose,
}: InsertStoreManagementModalTagPropsInterface) {
  const dispatch = useDispatch();

  const [InsertStoreListAPI] = InsertStoreListAPIHook();
  const [GetStoreListAPI] = GetStoreListAPIHook();

  const inputSlice: { value: Record<string, string> } = useSelector(
    (state: { inputSlice: { value: Record<string, string> } }) =>
      state.inputSlice,
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
    if (!showModal) return;

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-client_id`,
        value: "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-store`,
        value: "",
      }),
    );

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-content`,
        value: "[]",
      }),
    );
  }, [showModal, dispatch]);

  const HandleInsertButtonOnClick = () => {
    const client_id = inputSlice?.value?.[`${inputPrefix}-client_id`] ?? "";
    const store = inputSlice?.value?.[`${inputPrefix}-store`] ?? "";
    const contentString = inputSlice?.value?.[`${inputPrefix}-content`] ?? "[]";

    if (!client_id || !store.trim()) return;

    let contentParsed: any[] = [];

    try {
      const parsedValue = JSON.parse(contentString);

      if (!Array.isArray(parsedValue)) {
        alert("Il campo content deve essere un array JSON.");
        return;
      }

      contentParsed = parsedValue;
    } catch {
      alert("JSON non valido nel campo content.");
      return;
    }

    InsertStoreListAPI({
      showLoader: true,
      showToast: true,
      data: {
        client_id,
        store: store.trim(),
        content: contentParsed,
      },
      EndCallback: () => {
        GetStoreListAPI({
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
      size="lg"
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
          <Modal.Title>Inserisci store</Modal.Title>

          <span
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "4px",
            }}
          >
            Crea un nuovo store
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
                Client
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

            <TextInputTitleTag
              idInput={`${inputPrefix}-store`}
              title="Store Name"
            />

            <div style={{ gridColumn: "1 / -1" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Content JSON
              </span>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <MonacoEditorTag
                  height="260px"
                  defaultLanguage="json"
                  value={inputSlice?.value?.[`${inputPrefix}-content`] ?? "[]"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                  onChange={(value) => {
                    dispatch(
                      SetInputSlice({
                        id: `${inputPrefix}-content`,
                        value: value ?? "[]",
                      }),
                    );
                  }}
                />
              </div>
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
              textToSee="Inserisci"
              clickCallBack={HandleInsertButtonOnClick}
              disabledButton={
                !inputSlice?.value?.[`${inputPrefix}-client_id`] ||
                !inputSlice?.value?.[`${inputPrefix}-store`]?.trim() ||
                (() => {
                  try {
                    const parsed = JSON.parse(
                      inputSlice?.value?.[`${inputPrefix}-content`] ?? "",
                    );
                    return !Array.isArray(parsed);
                  } catch {
                    return true;
                  }
                })()
              }
            />
          </div>
        </Suspense>
      </Modal.Body>
    </Modal>
  );
}

export default InsertStoreManagementModalTag;
