import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Modal } from "rsuite";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import TextInputTitleTag from "../input/TextInputTitle";

const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

type TemplateBaseOperationType =
  | "add_base_concept"
  | "remove_base_concept"
  | "update_base_metadata";

interface TemplateBasePatchFormTagPropsInterface {
  inputPrefix: string;
}

interface TemplateBaseFieldInterface {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  type: "text" | "select";
  options?: { label: string; value: string }[];
}

interface TemplateBaseOperationConfigInterface {
  label: string;
  helperText?: string;
  fields: TemplateBaseFieldInterface[];
}

interface AddBaseConceptStoredInterface {
  category_id: string;
  concept_id: string;
  semantic_category: string;
  label: {
    it: string;
    en: string;
  };
  description: string;
}

const CATEGORY_OPTIONS = [
  { label: "measurement", value: "measurement" },
  { label: "parameter", value: "parameter" },
  { label: "alarm", value: "alarm" },
  { label: "warning", value: "warning" },
  { label: "command", value: "command" },
  { label: "virtual_variable", value: "virtual_variable" },
];

const TEMPLATE_BASE_OPERATIONS: Record<
  TemplateBaseOperationType,
  TemplateBaseOperationConfigInterface
> = {
  add_base_concept: {
    label: "Add Base Concept",
    helperText: "Aggiunge uno o più concept al template base.",
    fields: [
      {
        id: "category_id",
        label: "Category ID",
        type: "select",
        options: CATEGORY_OPTIONS,
      },
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_probe",
        type: "text",
      },
      {
        id: "semantic_category",
        label: "Semantic Category",
        placeholder: "Es. temperature",
        type: "text",
      },
      {
        id: "label_it",
        label: "Label IT",
        placeholder: "Es. Temperatura sonda",
        type: "text",
      },
      {
        id: "label_en",
        label: "Label EN",
        placeholder: "Es. Probe temperature",
        type: "text",
      },
      {
        id: "description",
        label: "Description",
        placeholder: "Es. Temperatura rilevata da una sonda generica.",
        type: "text",
      },
    ],
  },

  remove_base_concept: {
    label: "Remove Base Concept",
    helperText: "Rimuove un concept esistente dal template base.",
    fields: [
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_probe",
        type: "text",
      },
    ],
  },

  update_base_metadata: {
    label: "Update Base Metadata",
    helperText:
      "Aggiorna metadata, label e descrizione di un concept esistente.",
    fields: [
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_defrost",
        type: "text",
      },
      {
        id: "label_it",
        label: "Label IT",
        placeholder: "Es. Temperatura sbrinamento",
        type: "text",
      },
      {
        id: "label_en",
        label: "Label EN",
        placeholder: "Es. Defrost temperature",
        type: "text",
      },
      {
        id: "description",
        label: "Description",
        placeholder: "Es. Temperatura associata alla fase di sbrinamento.",
        type: "text",
      },
      {
        id: "category",
        label: "Category",
        type: "select",
        options: CATEGORY_OPTIONS,
      },
      {
        id: "semantic_category",
        label: "Semantic Category",
        placeholder: "Es. temperature",
        type: "text",
      },
    ],
  },
};

function TemplateBasePatchFormTag({
  inputPrefix,
}: TemplateBasePatchFormTagPropsInterface) {
  const dispatch = useDispatch();

  const inputSliceValue: Record<string, string> = useSelector((state: any) => {
    return state.inputSlice.value ?? {};
  });

  const operationInputId = `${inputPrefix}-operation`;
  const textAreaInputId = `${inputPrefix}-TextArea`;
  const conceptsTextAreaInputId = `${inputPrefix}-Concepts-TextArea`;

  const [conceptsList, setConceptsList] = useState<
    AddBaseConceptStoredInterface[]
  >([]);
  const [showConceptsModal, setShowConceptsModal] = useState<boolean>(false);
  const [conceptsEditorValue, setConceptsEditorValue] = useState<string>("[]");

  const currentOperation = (inputSliceValue[operationInputId] ?? "") as
    | TemplateBaseOperationType
    | "";

  const currentOperationConfig = currentOperation
    ? TEMPLATE_BASE_OPERATIONS[currentOperation]
    : null;

  const HandleInputChange = (id: string, value: string) => {
    dispatch(
      SetInputSlice({
        id,
        value,
      }),
    );
  };

  const getFieldValue = (fieldId: string) => {
    return inputSliceValue[`${inputPrefix}-${fieldId}`] ?? "";
  };

  const clearAddBaseConceptForm = () => {
    [
      "category_id",
      "concept_id",
      "semantic_category",
      "label_it",
      "label_en",
      "description",
    ].forEach((fieldId) => {
      dispatch(
        SetInputSlice({
          id: `${inputPrefix}-${fieldId}`,
          value: "",
        }),
      );
    });
  };

  const buildAddBaseConceptDraft = () => {
    return {
      category_id: getFieldValue("category_id"),
      concept_id: getFieldValue("concept_id"),
      semantic_category: getFieldValue("semantic_category"),
      label_it: getFieldValue("label_it"),
      label_en: getFieldValue("label_en"),
      description: getFieldValue("description"),
    };
  };

  const isAddBaseConceptDraftValid = () => {
    const draft = buildAddBaseConceptDraft();

    return (
      draft.category_id.trim() !== "" &&
      draft.concept_id.trim() !== "" &&
      draft.semantic_category.trim() !== "" &&
      draft.label_it.trim() !== "" &&
      draft.label_en.trim() !== "" &&
      draft.description.trim() !== ""
    );
  };

  const handleAddBaseConcept = () => {
    if (!isAddBaseConceptDraftValid()) return;

    const draft = buildAddBaseConceptDraft();

    setConceptsList((previousStateVal) => {
      return [
        ...previousStateVal,
        {
          category_id: draft.category_id.trim(),
          concept_id: draft.concept_id.trim(),
          semantic_category: draft.semantic_category.trim(),
          label: {
            it: draft.label_it.trim(),
            en: draft.label_en.trim(),
          },
          description: draft.description.trim(),
        },
      ];
    });

    clearAddBaseConceptForm();
  };

  const handleOpenConceptsModal = () => {
    const conceptsJson = JSON.stringify(conceptsList, null, 2);

    setConceptsEditorValue(conceptsJson);

    dispatch(
      SetInputSlice({
        id: conceptsTextAreaInputId,
        value: conceptsJson,
      }),
    );

    setShowConceptsModal(true);
  };

  const handleCloseConceptsModal = () => {
    setShowConceptsModal(false);
  };

  const handleConceptsEditorChange = (value: string | undefined) => {
    const newValue = value ?? "";

    setConceptsEditorValue(newValue);

    dispatch(
      SetInputSlice({
        id: conceptsTextAreaInputId,
        value: newValue,
      }),
    );
  };

  const handleApplyConceptsEditor = () => {
    try {
      const parsedValue = JSON.parse(conceptsEditorValue);

      if (!Array.isArray(parsedValue)) return;

      setConceptsList(parsedValue);
      setShowConceptsModal(false);
    } catch {
      return;
    }
  };

  const buildTemplateBasePatchJson = () => {
    if (!currentOperation) {
      return JSON.stringify(
        {
          target: "template_base",
          operations: [],
        },
        null,
        2,
      );
    }

    if (currentOperation === "add_base_concept") {
      return JSON.stringify(
        {
          target: "template_base",
          operations: conceptsList.map((singleConcept) => ({
            op: "add_base_concept",
            ...singleConcept,
          })),
        },
        null,
        2,
      );
    }

    let operationPayload: Record<string, any> = {
      op: currentOperation,
    };

    if (currentOperation === "remove_base_concept") {
      operationPayload = {
        op: "remove_base_concept",
        concept_id: getFieldValue("concept_id"),
      };
    }

    if (currentOperation === "update_base_metadata") {
      operationPayload = {
        op: "update_base_metadata",
        concept_id: getFieldValue("concept_id"),
        label: {
          it: getFieldValue("label_it"),
          en: getFieldValue("label_en"),
        },
        description: getFieldValue("description"),
        category: getFieldValue("category"),
        semantic_category: getFieldValue("semantic_category"),
      };
    }

    return JSON.stringify(
      {
        target: "template_base",
        operations: [operationPayload],
      },
      null,
      2,
    );
  };

  const jsonPreview = useMemo(() => {
    return buildTemplateBasePatchJson();
  }, [
    inputPrefix,
    currentOperation,
    inputSliceValue[`${inputPrefix}-category_id`],
    inputSliceValue[`${inputPrefix}-concept_id`],
    inputSliceValue[`${inputPrefix}-semantic_category`],
    inputSliceValue[`${inputPrefix}-label_it`],
    inputSliceValue[`${inputPrefix}-label_en`],
    inputSliceValue[`${inputPrefix}-description`],
    inputSliceValue[`${inputPrefix}-category`],
    conceptsList,
  ]);

  useEffect(() => {
    dispatch(
      SetInputSlice({
        id: textAreaInputId,
        value: jsonPreview,
      }),
    );
  }, [dispatch, jsonPreview, textAreaInputId]);

  useEffect(() => {
    if (currentOperation !== "add_base_concept") return;

    clearAddBaseConceptForm();
  }, [currentOperation]);

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "6px",
    display: "block",
  };

  const helperStyle = {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px",
    lineHeight: "1.4",
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box" as const,
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  };

  const inputCardStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box" as const,
  };

  const RenderField = (field: TemplateBaseFieldInterface) => {
    const fieldInputId = `${inputPrefix}-${field.id}`;
    const fieldValue = inputSliceValue[fieldInputId] ?? "";

    if (field.type === "text") {
      return (
        <div style={inputCardStyle}>
          <TextInputTitleTag
            idInput={fieldInputId}
            title={field.label}
            placeholder={field.placeholder ?? ""}
          />
          {field.helperText ? (
            <div
              style={{ ...helperStyle, marginBottom: "0", marginTop: "8px" }}
            >
              {field.helperText}
            </div>
          ) : null}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div style={inputCardStyle}>
          <span style={labelStyle}>{field.label}</span>
          {field.helperText ? (
            <div style={helperStyle}>{field.helperText}</div>
          ) : null}

          <Suspense fallback={null}>
            <SelectPickerTag
              data={(field.options ?? []).map((singleOption) => ({
                label: singleOption.label,
                value: singleOption.value,
              }))}
              value={fieldValue || null}
              onChange={(value) => {
                HandleInputChange(fieldInputId, String(value ?? ""));
              }}
              placeholder="Seleziona"
              cleanable={false}
              searchable={false}
              block
              style={{ width: "100%" }}
            />
          </Suspense>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Template Base Patch
          </span>

          <span
            style={{
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Form dedicato per il target template_base.
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            alignItems: "start",
          }}
        >
          <div style={inputCardStyle}>
            <span style={labelStyle}>Operation</span>

            <Suspense fallback={null}>
              <SelectPickerTag
                data={Object.entries(TEMPLATE_BASE_OPERATIONS).map(
                  ([operationKey, operationValue]) => ({
                    label: operationValue.label,
                    value: operationKey,
                  }),
                )}
                value={currentOperation || null}
                onChange={(value) => {
                  HandleInputChange(operationInputId, String(value ?? ""));
                }}
                placeholder="Seleziona operazione"
                cleanable={false}
                searchable={false}
                block
                style={{ width: "100%" }}
              />
            </Suspense>
          </div>
        </div>

        {currentOperationConfig ? (
          <>
            {currentOperationConfig.helperText ? (
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginTop: "-8px",
                }}
              >
                {currentOperationConfig.helperText}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
                gap: "16px",
                alignItems: "start",
              }}
            >
              {currentOperationConfig.fields.map((singleField) => (
                <div
                  key={`${inputPrefix}-${singleField.id}`}
                  style={{
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  {RenderField(singleField)}
                </div>
              ))}
            </div>

            {currentOperation === "add_base_concept" ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  Concepts aggiunti: <b>{conceptsList.length}</b>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <Button
                    appearance="primary"
                    onClick={handleAddBaseConcept}
                    disabled={!isAddBaseConceptDraftValid()}
                  >
                    Aggiungi concept
                  </Button>

                  <Button
                    appearance="default"
                    onClick={handleOpenConceptsModal}
                  >
                    Mostra concepts
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            JSON preview
          </span>

          <span
            style={{
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            Anteprima generata automaticamente dal form.
          </span>

          <div
            style={{
              width: "100%",
              minHeight: "260px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              padding: "12px",
              boxSizing: "border-box",
              fontSize: "13px",
              fontFamily: "monospace",
              backgroundColor: "#f9fafb",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {jsonPreview}
          </div>
        </div>
      </div>

      <Modal open={showConceptsModal} onClose={handleCloseConceptsModal} size="lg">
        <Modal.Header>
          <Modal.Title>Concepts preview</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div
            style={{
              height: "60vh",
              minHeight: "420px",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            <Suspense
              fallback={<div style={{ padding: "16px" }}>Caricamento editor...</div>}
            >
              <MonacoEditorTag
                height="100%"
                defaultLanguage="json"
                value={conceptsEditorValue}
                onChange={handleConceptsEditorChange}
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  formatOnPaste: true,
                  formatOnType: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </Suspense>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button appearance="subtle" onClick={handleCloseConceptsModal}>
            Chiudi
          </Button>
          <Button appearance="primary" onClick={handleApplyConceptsEditor}>
            Applica
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TemplateBasePatchFormTag;