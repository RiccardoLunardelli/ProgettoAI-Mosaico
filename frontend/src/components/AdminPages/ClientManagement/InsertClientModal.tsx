import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  SetClientListSlice,
  type ClientListInterface,
} from "../../../stores/slices/Base/ClientListSlice";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import { InsertClientListAPIHook } from "../../../customHooks/API/Client/ClientAPI";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const TextInputTitleTag = lazy(() => import("../../input/TextInputTitle"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

const inputPrefix = "InsertClientManagement";

interface InsertClientModalTagPropsInterface {
  showModal: boolean;
  onClose: () => void;
}

function InsertClientModalTag({
  showModal,
  onClose,
}: InsertClientModalTagPropsInterface) {
  const dispatch = useDispatch();

  const [InsertClientListAPI] = InsertClientListAPIHook();

  const inputSlice: { value: Record<string, string> } = useSelector(
    (state: { inputSlice: { value: Record<string, string> } }) =>
      state.inputSlice,
  );

  const clientListSlice: { value: ClientListInterface[] } = useSelector(
    (state: { clientListSlice: { value: ClientListInterface[] } }) =>
      state.clientListSlice,
  );

  useEffect(() => {
    if (!showModal) return;

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-name`,
        value: "",
      }),
    );
  }, [showModal, dispatch]);

  const HandleInsertButtonOnClick = () => {
    const newName = inputSlice?.value?.[`${inputPrefix}-name`] ?? "";

    if (!newName.trim()) return;

    InsertClientListAPI({
      showLoader: true,
      showToast: true,
      data: {
        name: newName.trim(),
      },
      EndCallback: () => {
        const alreadyExists = (clientListSlice?.value ?? []).some(
          (singleClient: ClientListInterface) =>
            String(
              (singleClient as ClientListInterface & { name?: string })?.name ??
                "",
            ) === String(newName.trim()),
        );

        if (!alreadyExists) {
          dispatch(
            SetClientListSlice([
              ...(clientListSlice?.value ?? []),
              { name: newName.trim() } as ClientListInterface,
            ]),
          );
        }

        dispatch(
          SetInputSlice({
            id: `${inputPrefix}-name`,
            value: "",
          }),
        );

        onClose();
      },
    });
  };

  if (!showModal) return <></>;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.35)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        zIndex: 10001,
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
          width: "min(700px, 92vw)",
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.20)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            minHeight: "72px",
            height: "72px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
            borderTopLeftRadius: "18px",
            borderTopRightRadius: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Inserisci client
            </span>

            <span
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "500px",
              }}
            >
              Crea un nuovo client
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: "#f8fafc",
            padding: "18px",
            boxSizing: "border-box",
            overflow: "auto",
            borderBottomLeftRadius: "18px",
            borderBottomRightRadius: "18px",
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <TextInputTitleTag
                idInput={`${inputPrefix}-name`}
                title="Nome client"
              />
            </div>

            <div style={{ marginTop: "14px" }}>
              <BasicButtonGenericTag
                textToSee="Inserisci"
                clickCallBack={HandleInsertButtonOnClick}
              />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default InsertClientModalTag;