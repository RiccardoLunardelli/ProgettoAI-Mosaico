import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  SetClientListSlice,
  type ClientListInterface,
} from "../../../stores/slices/Base/ClientListSlice";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import { UpdateClientListAPIHook } from "../../../customHooks/API/Client/ClientAPI";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const TextInputTitleTag = lazy(() => import("../../input/TextInputTitle"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
import { Modal } from "rsuite";

const inputPrefix = "ClientManagement";

interface ClientManagementModalTagPropsInterface {
  showModal: boolean;
  selectedClient?: ClientListInterface;
  selectedName: string;
  onClose: () => void;
}

function ClientManagementModalTag({
  showModal,
  selectedClient,
  selectedName,
  onClose,
}: ClientManagementModalTagPropsInterface) {
  const dispatch = useDispatch();

  const [UpdateClientListAPI] = UpdateClientListAPIHook();

  const inputSlice: { value: Record<string, string> } = useSelector(
    (state: { inputSlice: { value: Record<string, string> } }) =>
      state.inputSlice,
  );

  const clientListSlice: { value: ClientListInterface[] } = useSelector(
    (state: { clientListSlice: { value: ClientListInterface[] } }) =>
      state.clientListSlice,
  );

  useEffect(() => {
    if (!showModal || !selectedClient) return;

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-name`,
        value:
          (selectedClient as ClientListInterface & { name?: string })?.name ??
          "",
      }),
    );
  }, [showModal, selectedClient, dispatch]);

  const HandleSaveButtonOnClick = () => {
    const originalName =
      (selectedClient as ClientListInterface & { name?: string })?.name ?? "";

    const newName = inputSlice?.value?.[`${inputPrefix}-name`] ?? "";

    if (!originalName || !newName.trim()) return;

    UpdateClientListAPI({
      showLoader: true,
      showToast: true,
      data: {
        name: originalName,
        new_name: newName.trim(),
      },
      EndCallback: () => {
        const list = [...(clientListSlice?.value ?? [])];

        const index = list.findIndex(
          (client) =>
            String(
              (client as ClientListInterface & { name?: string })?.name ?? "",
            ) === String(originalName),
        );

        if (index !== -1) {
          list[index] = {
            ...list[index],
            name: newName.trim(),
          } as ClientListInterface;
        }

        dispatch(SetClientListSlice(list));
        onClose();
      },
    });
  };

  return (
    <Suspense fallback={<></>}>
      <Modal
        open={showModal}
        onClose={onClose}
        size="sm"
        backdrop="static"
        keyboard={true}
      >
        <Modal.Header>
          <Modal.Title>Modifica client</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#6b7280",
                lineHeight: "1.4",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {selectedName}
            </span>

            <Suspense
              fallback={""}
            >
              {selectedClient ? (
                <TextInputTitleTag
                  idInput={`${inputPrefix}-name`}
                  title="Nome client"
                />
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
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <BasicButtonGenericTag
              textToSee="Chiudi"
              clickCallBack={onClose}
            />

            <BasicButtonGenericTag
              textToSee="Salva"
              clickCallBack={HandleSaveButtonOnClick}
            />
          </div>
        </Modal.Footer>
      </Modal>
    </Suspense>
  );
}

export default ClientManagementModalTag;