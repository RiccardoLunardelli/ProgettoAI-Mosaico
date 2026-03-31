import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Modal } from "rsuite";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import TextInputTitleTag from "../input/TextInputTitle";

const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

type DictionaryOperationType =
  | "add_abbreviation"
  | "add_concept"
  | "add_synonym"
  | "update_category"
  | "update_semantic_category"
  | "update_synonym";

interface DictionaryPatchFormTagPropsInterface {
  inputPrefix: string;
}

interface DictionaryFieldInterface {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  type: "text" | "select";
  options?: { label: string; value: string }[];
}

interface DictionaryOperationConfigInterface {
  label: string;
  helperText?: string;
  fields: DictionaryFieldInterface[];
}

interface AddConceptDraftInterface {
  concept_id: string;
  category: string;
  semantic_category: string;
  synonyms_it: string;
  synonyms_en: string;
  abbreviations: string;
}

interface AddConceptStoredInterface {
  concept_id: string;
  category: string;
  semantic_category: string;
  synonyms: {
    it: string[];
    en: string[];
  };
  abbreviations: string[];
}

const CATEGORY_OPTIONS = [
  { label: "measurement", value: "measurement" },
  { label: "parameter", value: "parameter" },
  { label: "alarm", value: "alarm" },
  { label: "warning", value: "warning" },
  { label: "command", value: "command" },
  { label: "virtual_variable", value: "virtual_variable" },
];

const LANG_OPTIONS = [
  { label: "Italiano", value: "it" },
  { label: "English", value: "en" },
];

const DICTIONARY_OPERATIONS: Record<
  DictionaryOperationType,
  DictionaryOperationConfigInterface
> = {
  add_abbreviation: {
    label: "Add Abbreviation",
    helperText: "Aggiunge un'abbreviazione a un concept esistente.",
    fields: [
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_defrost",
        type: "text",
      },
      {
        id: "value",
        label: "Abbreviation",
        placeholder: "Es. TD",
        type: "text",
      },
    ],
  },

  add_concept: {
    label: "Add Concept",
    helperText: "Aggiunge uno o più concept nel dictionary.",
    fields: [
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_probe_p4",
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
        placeholder: "Es. temperature_probe_value",
        type: "text",
      },
      {
        id: "synonyms_it",
        label: "Synonyms IT",
        placeholder:
          "Es. valore sonda p4 temperatura, temperatura sonda p4",
        helperText: "Valori separati da virgola.",
        type: "text",
      },
      {
        id: "synonyms_en",
        label: "Synonyms EN",
        placeholder: "Es. probe p4 temperature value",
        helperText: "Valori separati da virgola.",
        type: "text",
      },
      {
        id: "abbreviations",
        label: "Abbreviations",
        placeholder: "Es. TP4, P4TEMP",
        helperText: "Valori separati da virgola.",
        type: "text",
      },
    ],
  },

  add_synonym: {
    label: "Add Synonym",
    helperText: "Aggiunge un sinonimo a un concept esistente.",
    fields: [
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_defrost",
        type: "text",
      },
      {
        id: "lang",
        label: "Language",
        type: "select",
        options: LANG_OPTIONS,
      },
      {
        id: "value",
        label: "Synonym",
        placeholder: "Es. temperatura sbrinamento test",
        type: "text",
      },
    ],
  },

  update_category: {
    label: "Update Category",
    helperText: "Aggiorna la category di un concept.",
    fields: [
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_defrost",
        type: "text",
      },
      {
        id: "category",
        label: "Category",
        type: "select",
        options: CATEGORY_OPTIONS,
      },
    ],
  },

  update_semantic_category: {
    label: "Update Semantic Category",
    helperText: "Aggiorna la semantic category di un concept.",
    fields: [
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_defrost",
        type: "text",
      },
      {
        id: "semantic_category",
        label: "Semantic Category",
        placeholder: "Es. pressione",
        type: "text",
      },
    ],
  },

  update_synonym: {
    label: "Update Synonym",
    helperText: "Sostituisce un sinonimo esistente.",
    fields: [
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_defrost",
        type: "text",
      },
      {
        id: "lang",
        label: "Language",
        type: "select",
        options: LANG_OPTIONS,
      },
      {
        id: "old_value",
        label: "Old Value",
        placeholder: "Es. temperatura sbrinamento",
        type: "text",
      },
      {
        id: "new_value",
        label: "New Value",
        placeholder: "Es. temperatura fase sbrinamento",
        type: "text",
      },
    ],
  },
};

function DictionaryPatchFormTag({
  inputPrefix,
}: DictionaryPatchFormTagPropsInterface) {
  const dispatch = useDispatch();

  const inputSliceValue = useSelector((state: any) => ({
    operation: state.inputSlice.value?.[`${inputPrefix}-operation`] ?? "",
    concept_id: state.inputSlice.value?.[`${inputPrefix}-concept_id`] ?? "",
    value: state.inputSlice.value?.[`${inputPrefix}-value`] ?? "",
    category: state.inputSlice.value?.[`${inputPrefix}-category`] ?? "",
    semantic_category:
      state.inputSlice.value?.[`${inputPrefix}-semantic_category`] ?? "",
    synonyms_it: state.inputSlice.value?.[`${inputPrefix}-synonyms_it`] ?? "",
    synonyms_en: state.inputSlice.value?.[`${inputPrefix}-synonyms_en`] ?? "",
    abbreviations:
      state.inputSlice.value?.[`${inputPrefix}-abbreviations`] ?? "",
    lang: state.inputSlice.value?.[`${inputPrefix}-lang`] ?? "",
    old_value: state.inputSlice.value?.[`${inputPrefix}-old_value`] ?? "",
    new_value: state.inputSlice.value?.[`${inputPrefix}-new_value`] ?? "",
    textArea: state.inputSlice.value?.[`${inputPrefix}-TextArea`] ?? "",
    conceptsTextArea:
      state.inputSlice.value?.[`${inputPrefix}-Concepts-TextArea`] ?? "",
  }));

  const operationInputId = `${inputPrefix}-operation`;
  const textAreaInputId = `${inputPrefix}-TextArea`;
  const conceptsTextAreaInputId = `${inputPrefix}-Concepts-TextArea`;

  const [conceptsList, setConceptsList] = useState<AddConceptStoredInterface[]>(
    [],
  );
  const [showConceptsModal, setShowConceptsModal] = useState<boolean>(false);
  const [conceptsEditorValue, setConceptsEditorValue] = useState<string>("[]");

  const currentOperation = inputSliceValue.operation as
    | DictionaryOperationType
    | "";

  const currentOperationConfig = currentOperation
    ? DICTIONARY_OPERATIONS[currentOperation]
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
    return inputSliceValue[fieldId as keyof typeof inputSliceValue] ?? "";
  };

  const parseCommaSeparatedArray = (value: string) => {
    return value
      .split(",")
      .map((singleValue) => singleValue.trim())
      .filter((singleValue) => singleValue !== "");
  };

  const clearAddConceptForm = () => {
    [
      "concept_id",
      "category",
      "semantic_category",
      "synonyms_it",
      "synonyms_en",
      "abbreviations",
    ].forEach((fieldId) => {
      dispatch(
        SetInputSlice({
          id: `${inputPrefix}-${fieldId}`,
          value: "",
        }),
      );
    });
  };

  const buildAddConceptDraft = (): AddConceptDraftInterface => {
    return {
      concept_id: getFieldValue("concept_id"),
      category: getFieldValue("category"),
      semantic_category: getFieldValue("semantic_category"),
      synonyms_it: getFieldValue("synonyms_it"),
      synonyms_en: getFieldValue("synonyms_en"),
      abbreviations: getFieldValue("abbreviations"),
    };
  };

  const isAddConceptDraftValid = () => {
    const draft = buildAddConceptDraft();

    return (
      draft.concept_id.trim() !== "" &&
      draft.category.trim() !== "" &&
      draft.semantic_category.trim() !== ""
    );
  };

  const handleAddConcept = () => {
    if (!isAddConceptDraftValid()) return;

    const draft = buildAddConceptDraft();

    const newConcept: AddConceptStoredInterface = {
      concept_id: draft.concept_id.trim(),
      category: draft.category.trim(),
      semantic_category: draft.semantic_category.trim(),
      synonyms: {
        it: parseCommaSeparatedArray(draft.synonyms_it),
        en: parseCommaSeparatedArray(draft.synonyms_en),
      },
      abbreviations: parseCommaSeparatedArray(draft.abbreviations),
    };

    setConceptsList((previousStateVal) => {
      return [...previousStateVal, newConcept];
    });

    clearAddConceptForm();
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

  const buildDictionaryPatchJson = () => {
    if (!currentOperation) {
      return JSON.stringify(
        {
          target: "dictionary",
          operations: [],
        },
        null,
        2,
      );
    }

    if (currentOperation === "add_concept") {
      return JSON.stringify(
        {
          target: "dictionary",
          operations: conceptsList.map((singleConcept) => ({
            op: "add_concept",
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

    if (currentOperation === "add_abbreviation") {
      operationPayload = {
        op: "add_abbreviation",
        concept_id: getFieldValue("concept_id"),
        value: getFieldValue("value"),
      };
    }

    if (currentOperation === "add_synonym") {
      operationPayload = {
        op: "add_synonym",
        concept_id: getFieldValue("concept_id"),
        lang: getFieldValue("lang"),
        value: getFieldValue("value"),
      };
    }

    if (currentOperation === "update_category") {
      operationPayload = {
        op: "update_category",
        concept_id: getFieldValue("concept_id"),
        category: getFieldValue("category"),
      };
    }

    if (currentOperation === "update_semantic_category") {
      operationPayload = {
        op: "update_semantic_category",
        concept_id: getFieldValue("concept_id"),
        semantic_category: getFieldValue("semantic_category"),
      };
    }

    if (currentOperation === "update_synonym") {
      operationPayload = {
        op: "update_synonym",
        concept_id: getFieldValue("concept_id"),
        lang: getFieldValue("lang"),
        old_value: getFieldValue("old_value"),
        new_value: getFieldValue("new_value"),
      };
    }

    return JSON.stringify(
      {
        target: "dictionary",
        operations: [operationPayload],
      },
      null,
      2,
    );
  };

  const jsonPreview = useMemo(() => {
    return buildDictionaryPatchJson();
  }, [
    currentOperation,
    inputSliceValue.concept_id,
    inputSliceValue.value,
    inputSliceValue.category,
    inputSliceValue.semantic_category,
    inputSliceValue.synonyms_it,
    inputSliceValue.synonyms_en,
    inputSliceValue.abbreviations,
    inputSliceValue.lang,
    inputSliceValue.old_value,
    inputSliceValue.new_value,
    conceptsList,
  ]);

  useEffect(() => {
    if (inputSliceValue.textArea === jsonPreview) return;

    dispatch(
      SetInputSlice({
        id: textAreaInputId,
        value: jsonPreview,
      }),
    );
  }, [dispatch, inputSliceValue.textArea, jsonPreview, textAreaInputId]);

  useEffect(() => {
    if (currentOperation !== "add_concept") return;

    clearAddConceptForm();
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
    minWidth: 0,
  };

  const inputCardStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box" as const,
    minWidth: 0,
  };

  const RenderField = (field: DictionaryFieldInterface) => {
    const fieldInputId = `${inputPrefix}-${field.id}`;
    const fieldValue = getFieldValue(field.id);

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
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Dictionary Patch
          </span>

          <span
            style={{
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Form dedicato per il target dictionary.
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            alignItems: "start",
            minWidth: 0,
          }}
        >
          <div style={inputCardStyle}>
            <span style={labelStyle}>Operation</span>

            <Suspense fallback={null}>
              <SelectPickerTag
                data={Object.entries(DICTIONARY_OPERATIONS).map(
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
                minWidth: 0,
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

            {currentOperation === "add_concept" ? (
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
                    onClick={handleAddConcept}
                    disabled={!isAddConceptDraftValid()}
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
            width: "100%",
            minWidth: 0,
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
            <Suspense fallback={<div style={{ padding: "16px" }}>Caricamento editor...</div>}>
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

export default DictionaryPatchFormTag;