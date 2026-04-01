import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Modal } from "rsuite";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import TextInputTitleTag from "../input/TextInputTitle";

const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);
const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

type KnowledgeBaseOperationType =
  | "add_scope"
  | "add_kb_rule"
  | "update_kb_rule";

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

type KnowledgeBaseMixedOperationInterface =
  | {
      op: "add_scope";
      scope: {
        scope_id: string;
        match: {
          template_guid: string;
          device_id: string;
          device_role: string;
          type_fam: string;
          enum: string | null;
        };
        source: {
          evidence: string;
        };
      };
    }
  | {
      op: "add_kb_rule";
      scope_id: string;
      source_type: string;
      source_key: string;
      concept_id: string;
      reason: string;
      evidence: string;
      semantic_category: string;
    };

const SOURCE_TYPE_OPTIONS = [
  { label: "ContinuosReads", value: "ContinuosReads" },
  { label: "Parameters", value: "Parameters" },
  { label: "Warnings", value: "Warnings" },
  { label: "Commands", value: "Commands" },
  { label: "Alarms", value: "Alarms" },
  { label: "VirtualVariables", value: "VirtualVariables" },
];

const KB_OPERATIONS: Record<
  KnowledgeBaseOperationType,
  KnowledgeBaseOperationConfigInterface
> = {
  add_scope: {
    label: "Add Scope",
    helperText: "Aggiunge uno scope nella knowledge base.",
    fields: [
      {
        id: "scope_id",
        label: "Scope ID",
        placeholder: "Es. P01T04D01_028d14de-71dc-6e64-9587-c7111a39793e",
        type: "text",
      },
      {
        id: "template_guid",
        label: "Template Guid",
        placeholder: "Es. 028d14de-71dc-6e64-9587-c7111a39793e",
        type: "text",
      },
      {
        id: "device_id",
        label: "Device ID",
        placeholder: "Es. P01T04D01",
        type: "text",
      },
      {
        id: "device_role",
        label: "Device Role",
        placeholder: "Es. basin",
        type: "text",
      },
      {
        id: "type_fam",
        label: "Type Fam",
        placeholder: "Es. TN",
        type: "text",
      },
      {
        id: "enum",
        label: "Enum",
        placeholder: "Lascia vuoto o scrivi null",
        type: "text",
      },
      {
        id: "evidence",
        label: "Evidence",
        placeholder: "Es. device_list_context",
        type: "text",
      },
    ],
  },

  add_kb_rule: {
    label: "Add KB Rule",
    helperText: "Aggiunge una regola nella knowledge base.",
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
  const operationsTextAreaInputId = `${inputPrefix}-Operations-TextArea`;

  const [operationsList, setOperationsList] = useState<
    KnowledgeBaseMixedOperationInterface[]
  >([]);
  const [showOperationsModal, setShowOperationsModal] =
    useState<boolean>(false);
  const [operationsEditorValue, setOperationsEditorValue] =
    useState<string>("[]");

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

  const clearAddScopeForm = () => {
    [
      "scope_id",
      "template_guid",
      "device_id",
      "device_role",
      "type_fam",
      "enum",
      "evidence",
    ].forEach((fieldId) => {
      dispatch(
        SetInputSlice({
          id: `${inputPrefix}-${fieldId}`,
          value: "",
        }),
      );
    });
  };

  const clearAddKbRuleForm = () => {
    [
      "scope_id",
      "source_type",
      "source_key",
      "concept_id",
      "reason",
      "evidence",
      "semantic_category",
    ].forEach((fieldId) => {
      dispatch(
        SetInputSlice({
          id: `${inputPrefix}-${fieldId}`,
          value: "",
        }),
      );
    });
  };

  const buildAddScopeOperation =
    (): KnowledgeBaseMixedOperationInterface | null => {
      const scope_id = getFieldValue("scope_id").trim();
      const template_guid = getFieldValue("template_guid").trim();
      const device_id = getFieldValue("device_id").trim();
      const device_role = getFieldValue("device_role").trim();
      const type_fam = getFieldValue("type_fam").trim();
      const enumValue = getFieldValue("enum").trim();
      const evidence = getFieldValue("evidence").trim();

      if (
        !scope_id ||
        !template_guid ||
        !device_id ||
        !device_role ||
        !type_fam ||
        !evidence
      ) {
        return null;
      }

      return {
        op: "add_scope",
        scope: {
          scope_id,
          match: {
            template_guid,
            device_id,
            device_role,
            type_fam,
            enum:
              enumValue === "" || enumValue.toLowerCase() === "null"
                ? null
                : enumValue,
          },
          source: {
            evidence,
          },
        },
      };
    };

  const buildAddKbRuleOperation =
    (): KnowledgeBaseMixedOperationInterface | null => {
      const scope_id = getFieldValue("scope_id").trim();
      const source_type = getFieldValue("source_type").trim();
      const source_key = getFieldValue("source_key").trim();
      const concept_id = getFieldValue("concept_id").trim();
      const reason = getFieldValue("reason").trim();
      const evidence = getFieldValue("evidence").trim();
      const semantic_category = getFieldValue("semantic_category").trim();

      if (
        !scope_id ||
        !source_type ||
        !source_key ||
        !concept_id ||
        !reason ||
        !evidence ||
        !semantic_category
      ) {
        return null;
      }

      return {
        op: "add_kb_rule",
        scope_id,
        source_type,
        source_key,
        concept_id,
        reason,
        evidence,
        semantic_category,
      };
    };

  const isCurrentAddOperationValid = () => {
    if (currentOperation === "add_scope") {
      return buildAddScopeOperation() !== null;
    }

    if (currentOperation === "add_kb_rule") {
      return buildAddKbRuleOperation() !== null;
    }

    return false;
  };

  const handleAddOperation = () => {
    if (currentOperation === "add_scope") {
      const operationPayload = buildAddScopeOperation();
      if (!operationPayload) return;

      setOperationsList((previousStateVal) => [
        ...previousStateVal,
        operationPayload,
      ]);

      clearAddScopeForm();
      return;
    }

    if (currentOperation === "add_kb_rule") {
      const operationPayload = buildAddKbRuleOperation();
      if (!operationPayload) return;

      setOperationsList((previousStateVal) => [
        ...previousStateVal,
        operationPayload,
      ]);

      clearAddKbRuleForm();
    }
  };

  const handleOpenOperationsModal = () => {
    const operationsJson = JSON.stringify(operationsList, null, 2);

    setOperationsEditorValue(operationsJson);

    dispatch(
      SetInputSlice({
        id: operationsTextAreaInputId,
        value: operationsJson,
      }),
    );

    setShowOperationsModal(true);
  };

  const handleCloseOperationsModal = () => {
    setShowOperationsModal(false);
  };

  const handleOperationsEditorChange = (value: string | undefined) => {
    const newValue = value ?? "";

    setOperationsEditorValue(newValue);

    dispatch(
      SetInputSlice({
        id: operationsTextAreaInputId,
        value: newValue,
      }),
    );
  };

  const handleApplyOperationsEditor = () => {
    try {
      const parsedValue = JSON.parse(operationsEditorValue);

      if (!Array.isArray(parsedValue)) return;

      setOperationsList(parsedValue);
      setShowOperationsModal(false);
    } catch {
      return;
    }
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

    if (currentOperation === "add_scope" || currentOperation === "add_kb_rule") {
      return JSON.stringify(
        {
          target: "kb",
          operations: operationsList,
        },
        null,
        2,
      );
    }

    if (currentOperation === "update_kb_rule") {
      return JSON.stringify(
        {
          target: "kb",
          operations: [
            {
              op: "update_kb_rule",
              scope_id: getFieldValue("scope_id"),
              source_type: getFieldValue("source_type"),
              source_key: getFieldValue("source_key"),
              concept_id: getFieldValue("concept_id"),
              reason: getFieldValue("reason"),
              evidence: getFieldValue("evidence"),
              semantic_category: getFieldValue("semantic_category"),
            },
          ],
        },
        null,
        2,
      );
    }

    return JSON.stringify(
      {
        target: "kb",
        operations: [],
      },
      null,
      2,
    );
  };

  const jsonPreview = useMemo(() => {
    return buildKnowledgeBasePatchJson();
  }, [
    currentOperation,
    inputSliceValue[`${inputPrefix}-scope_id`],
    inputSliceValue[`${inputPrefix}-source_type`],
    inputSliceValue[`${inputPrefix}-source_key`],
    inputSliceValue[`${inputPrefix}-concept_id`],
    inputSliceValue[`${inputPrefix}-reason`],
    inputSliceValue[`${inputPrefix}-evidence`],
    inputSliceValue[`${inputPrefix}-semantic_category`],
    inputSliceValue[`${inputPrefix}-template_guid`],
    inputSliceValue[`${inputPrefix}-device_id`],
    inputSliceValue[`${inputPrefix}-device_role`],
    inputSliceValue[`${inputPrefix}-type_fam`],
    inputSliceValue[`${inputPrefix}-enum`],
    operationsList,
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
    if (currentOperation === "add_scope") {
      clearAddScopeForm();
    }

    if (currentOperation === "add_kb_rule") {
      clearAddKbRuleForm();
    }
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

  const showAccumulationActions =
    currentOperation === "add_scope" || currentOperation === "add_kb_rule";

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

            {showAccumulationActions ? (
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
                  Operations aggiunte: <b>{operationsList.length}</b>
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
                    onClick={handleAddOperation}
                    disabled={!isCurrentAddOperationValid()}
                  >
                    Aggiungi operation
                  </Button>

                  <Button
                    appearance="default"
                    onClick={handleOpenOperationsModal}
                  >
                    Mostra operations
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

      <Modal
        open={showOperationsModal}
        onClose={handleCloseOperationsModal}
        size="lg"
      >
        <Modal.Header>
          <Modal.Title>Operations preview</Modal.Title>
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
              fallback={
                <div style={{ padding: "16px" }}>Caricamento editor...</div>
              }
            >
              <MonacoEditorTag
                height="100%"
                defaultLanguage="json"
                value={operationsEditorValue}
                onChange={handleOperationsEditorChange}
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
          <Button appearance="subtle" onClick={handleCloseOperationsModal}>
            Chiudi
          </Button>
          <Button appearance="primary" onClick={handleApplyOperationsEditor}>
            Applica
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default KnowledgeBasePatchFormTag;