import { lazy, Suspense, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import TextInputTitleTag from "../input/TextInputTitle";

const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);

const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

type KnowledgeBaseOperationType = "add_kb_rule" | "update_kb_rule";

interface KnowledgeBasePatchFormTagPropsInterface {
  inputPrefix: string;
}

interface KnowledgeBaseFieldInterface {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  type: "text" | "select";
  options?: { label: string; value: string }[];
}

interface KnowledgeBaseOperationConfigInterface {
  label: string;
  helperText?: string;
  fields: KnowledgeBaseFieldInterface[];
}

const SOURCE_TYPE_OPTIONS = [
  { label: "ContinuosReads", value: "ContinuosReads" },
  { label: "ContinuosRead", value: "ContinuosRead" },
];

const KB_OPERATIONS: Record<
  KnowledgeBaseOperationType,
  KnowledgeBaseOperationConfigInterface
> = {
  add_kb_rule: {
    label: "Add KB Rule",
    helperText: "Aggiunge una nuova regola nella knowledge base.",
    fields: [
      {
        id: "scope_id",
        label: "Scope ID",
        placeholder: "Es. P01T04D01_028d14de-71dc-6e64-9587-c7111a39793e",
        type: "text",
      },
      {
        id: "source_type",
        label: "Source Type",
        type: "select",
        options: SOURCE_TYPE_OPTIONS,
      },
      {
        id: "source_key",
        label: "Source Key",
        placeholder: "Es. Read59",
        type: "text",
      },
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_test",
        type: "text",
      },
      {
        id: "reason",
        label: "Reason",
        placeholder: "Es. deterministic_mapping_from_vendor",
        type: "text",
      },
      {
        id: "evidence",
        label: "Evidence",
        placeholder: "Es. manual_patch_test",
        type: "text",
      },
      {
        id: "semantic_category",
        label: "Semantic Category",
        placeholder: "Es. temperature",
        type: "text",
      },
    ],
  },

  update_kb_rule: {
    label: "Update KB Rule",
    helperText: "Aggiorna una regola esistente della knowledge base.",
    fields: [
      {
        id: "scope_id",
        label: "Scope ID",
        placeholder: "Es. P01T04D01_028d14de-71dc-6e64-9587-c7111a39793e",
        type: "text",
      },
      {
        id: "source_type",
        label: "Source Type",
        type: "select",
        options: SOURCE_TYPE_OPTIONS,
      },
      {
        id: "source_key",
        label: "Source Key",
        placeholder: "Es. Read101",
        type: "text",
      },
      {
        id: "concept_id",
        label: "Concept ID",
        placeholder: "Es. temp_delivery",
        type: "text",
      },
      {
        id: "reason",
        label: "Reason",
        placeholder: "Es. correction_after_review",
        type: "text",
      },
      {
        id: "evidence",
        label: "Evidence",
        placeholder: "Es. manual_patch_update",
        type: "text",
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

function KnowledgeBasePatchFormTag({
  inputPrefix,
}: KnowledgeBasePatchFormTagPropsInterface) {
  const dispatch = useDispatch();

  const inputSliceValue: Record<string, string> = useSelector((state: any) => {
    return state.inputSlice.value ?? {};
  });

  const operationInputId = `${inputPrefix}-operation`;
  const textAreaInputId = `${inputPrefix}-TextArea`;

  const currentOperation = (inputSliceValue[operationInputId] ?? "") as
    | KnowledgeBaseOperationType
    | "";

  const currentOperationConfig = currentOperation
    ? KB_OPERATIONS[currentOperation]
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

  const buildKnowledgeBasePatchJson = () => {
    if (!currentOperation) {
      return JSON.stringify(
        {
          target: "kb",
          operations: [],
        },
        null,
        2,
      );
    }

    let operationPayload: Record<string, any> = {
      op: currentOperation,
    };

    if (currentOperation === "add_kb_rule") {
      operationPayload = {
        op: "add_kb_rule",
        scope_id: getFieldValue("scope_id"),
        source_type: getFieldValue("source_type"),
        source_key: getFieldValue("source_key"),
        concept_id: getFieldValue("concept_id"),
        reason: getFieldValue("reason"),
        evidence: getFieldValue("evidence"),
        semantic_category: getFieldValue("semantic_category"),
      };
    }

    if (currentOperation === "update_kb_rule") {
      operationPayload = {
        op: "update_kb_rule",
        scope_id: getFieldValue("scope_id"),
        source_type: getFieldValue("source_type"),
        source_key: getFieldValue("source_key"),
        concept_id: getFieldValue("concept_id"),
        reason: getFieldValue("reason"),
        evidence: getFieldValue("evidence"),
        semantic_category: getFieldValue("semantic_category"),
      };
    }

    return JSON.stringify(
      {
        target: "kb",
        operations: [operationPayload],
      },
      null,
      2,
    );
  };

  const jsonPreview = useMemo(() => {
    return buildKnowledgeBasePatchJson();
  }, [inputSliceValue, inputPrefix, currentOperation]);

  useEffect(() => {
    dispatch(
      SetInputSlice({
        id: textAreaInputId,
        value: jsonPreview,
      }),
    );
  }, [dispatch, jsonPreview, textAreaInputId]);

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

  const RenderField = (field: KnowledgeBaseFieldInterface) => {
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
          Knowledge Base Patch
        </span>

        <span
          style={{
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Form dedicato per il target knowledge base.
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
              data={Object.entries(KB_OPERATIONS).map(
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
  );
}

export default KnowledgeBasePatchFormTag;