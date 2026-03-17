import { lazy, Suspense, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "rsuite";
import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import { InsertArtifactListAPIHook } from "../../../customHooks/API/Artifact/ArtifactAPI";

const TextInputTitleTag = lazy(() => import("../../input/TextInputTitle"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

const inputPrefix = "InsertArtifactManagement";

interface InsertArtifactManagementModalTagPropsInterface {
  showModal: boolean;
  onClose: () => void;
}

function InsertArtifactManagementModalTag({
  showModal,
  onClose,
}: InsertArtifactManagementModalTagPropsInterface) {
  const dispatch = useDispatch();
  const [InsertArtifactListAPI] = InsertArtifactListAPIHook();

  const inputSlice: {
    value: Record<string, string>;
  } = useSelector((state: any) => state.inputSlice);

  const inputValue = useMemo(() => {
    return {
      name: inputSlice?.value?.[`${inputPrefix}-Name`] ?? "",
      type: inputSlice?.value?.[`${inputPrefix}-Type`] ?? "",
      version: inputSlice?.value?.[`${inputPrefix}-Version`] ?? "",
      content: inputSlice?.value?.[`${inputPrefix}-Content`] ?? "",
    };
  }, [inputSlice]);

  const IsValidJSON = (value: string) => {
    if (!value || value.trim() === "") return false;

    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  const disabledSaveButton =
    inputValue.name.trim() === "" ||
    inputValue.type.trim() === "" ||
    inputValue.version.trim() === "" ||
    !IsValidJSON(inputValue.content);

  const HandleCloseModal = () => {
    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-Name`,
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-Type`,
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-Version`,
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-Content`,
        value: "",
      }),
    );

    onClose();
  };

  const HandleInsertArtifactOnClick = () => {
    InsertArtifactListAPI({
      showLoader: true,
      showToast: true,
      saveResponse: false,
      data: {
        name: inputValue.name,
        type: inputValue.type,
        version: inputValue.version,
        content: JSON.parse(inputValue.content),
      },
      EndCallback() {
        HandleCloseModal();
      },
    });
  };

  useEffect(() => {
    if (!showModal) return;

    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-Name`,
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-Type`,
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-Version`,
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: `${inputPrefix}-Content`,
        value: "{\n  \n}",
      }),
    );
  }, [showModal]);

  return (
    <Modal
      open={showModal}
      onClose={HandleCloseModal}
      size="lg"
      overflow={false}
    >
      <Modal.Header>
        <Modal.Title>Inserisci Artifact</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "14px",
              width: "100%",
            }}
          >
            <div style={{ width: "33%" }}>
              <Suspense fallback="">
                <TextInputTitleTag
                  idInput={`${inputPrefix}-Name`}
                  title="Name"
                  placeholder="Inserisci il name"
                />
              </Suspense>
            </div>

            <div style={{ width: "33%" }}>
              <Suspense fallback="">
                <TextInputTitleTag
                  idInput={`${inputPrefix}-Type`}
                  title="Type"
                  placeholder="Inserisci il type"
                />
              </Suspense>
            </div>

            <div style={{ width: "33%" }}>
              <Suspense fallback="">
                <TextInputTitleTag
                  idInput={`${inputPrefix}-Version`}
                  title="Version"
                  placeholder="Inserisci la version"
                />
              </Suspense>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Content
            </span>

            <div
              style={{
                border: "1px solid #dcdfe4",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <Suspense fallback="">
                <MonacoEditorTag
                  height="420px"
                  defaultLanguage="json"
                  language="json"
                  theme="vs-dark"
                  value={inputValue.content}
                  onChange={(value) => {
                    dispatch(
                      SetInputSlice({
                        id: `${inputPrefix}-Content`,
                        value: value ?? "",
                      }),
                    );
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                  }}
                />
              </Suspense>
            </div>

            {inputValue.content.trim() !== "" && !IsValidJSON(inputValue.content) ? (
              <span
                style={{
                  fontSize: "12px",
                  color: "#dc2626",
                  marginTop: "8px",
                }}
              >
                Il content deve essere un JSON valido
              </span>
            ) : null}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            width: "100%",
          }}
        >
          <Suspense fallback="">
            <BasicButtonGenericTag
              textToSee="Chiudi"
              clickCallBack={HandleCloseModal}
            />
          </Suspense>

          <Suspense fallback="">
            <BasicButtonGenericTag
              textToSee="Salva"
              disabledButton={disabledSaveButton}
              clickCallBack={HandleInsertArtifactOnClick}
            />
          </Suspense>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default InsertArtifactManagementModalTag;