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

interface AddKbRuleStoredInterface {
  scope_id: string;
  source_type: string;
  source_key: string;
  concept_id: string;
  reason: string;
  evidence: string;
  semantic_category: string;
}

interface AddScopeStoredInterface {
  scope_id: string;
  template_guid: string;
  device_id: string;
  device_role: string;
  type_fam: string;
  enum: string;
  evidence: string;
}

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
    helperText: "Aggiunge uno o più scope nella knowledge base.",
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
        placeholder: "Es. null oppure un valore",
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
    helperText: "Aggiunge una o più regole nella knowledge base.",
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
  const rulesTextAreaInputId = `${inputPrefix}-Rules-TextArea`;
  const scopesTextAreaInputId = `${inputPrefix}-Scopes-TextArea`;

  const [rulesList, setRulesList] = useState<AddKbRuleStoredInterface[]>([]);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [rulesEditorValue, setRulesEditorValue] = useState<string>("[]");

  const [scopesList, setScopesList] = useState<AddScopeStoredInterface[]>([]);
  const [showScopesModal, setShowScopesModal] = useState<boolean>(false);
  const [scopesEditorValue, setScopesEditorValue] = useState<string>("[]");

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

  const buildAddKbRuleDraft = (): AddKbRuleStoredInterface => {
    return {
      scope_id: getFieldValue("scope_id"),
      source_type: getFieldValue("source_type"),
      source_key: getFieldValue("source_key"),
      concept_id: getFieldValue("concept_id"),
      reason: getFieldValue("reason"),
      evidence: getFieldValue("evidence"),
      semantic_category: getFieldValue("semantic_category"),
    };
  };

  const buildAddScopeDraft = (): AddScopeStoredInterface => {
    return {
      scope_id: getFieldValue("scope_id"),
      template_guid: getFieldValue("template_guid"),
      device_id: getFieldValue("device_id"),
      device_role: getFieldValue("device_role"),
      type_fam: getFieldValue("type_fam"),
      enum: getFieldValue("enum"),
      evidence: getFieldValue("evidence"),
    };
  };

  const isAddKbRuleDraftValid = () => {
    const draft = buildAddKbRuleDraft();

    return (
      draft.scope_id.trim() !== "" &&
      draft.source_type.trim() !== "" &&
      draft.source_key.trim() !== "" &&
      draft.concept_id.trim() !== "" &&
      draft.reason.trim() !== "" &&
      draft.evidence.trim() !== "" &&
      draft.semantic_category.trim() !== ""
    );
  };

  const isAddScopeDraftValid = () => {
    const draft = buildAddScopeDraft();

    return (
      draft.scope_id.trim() !== "" &&
      draft.template_guid.trim() !== "" &&
      draft.device_id.trim() !== "" &&
      draft.device_role.trim() !== "" &&
      draft.type_fam.trim() !== "" &&
      draft.evidence.trim() !== ""
    );
  };

  const handleAddKbRule = () => {
    if (!isAddKbRuleDraftValid()) return;

    const draft = buildAddKbRuleDraft();

    setRulesList((previousStateVal) => {
      return [
        ...previousStateVal,
        {
          scope_id: draft.scope_id.trim(),
          source_type: draft.source_type.trim(),
          source_key: draft.source_key.trim(),
          concept_id: draft.concept_id.trim(),
          reason: draft.reason.trim(),
          evidence: draft.evidence.trim(),
          semantic_category: draft.semantic_category.trim(),
        },
      ];
    });

    clearAddKbRuleForm();
  };

  const handleAddScope = () => {
    if (!isAddScopeDraftValid()) return;

    const draft = buildAddScopeDraft();

    setScopesList((previousStateVal) => {
      return [
        ...previousStateVal,
        {
          scope_id: draft.scope_id.trim(),
          template_guid: draft.template_guid.trim(),
          device_id: draft.device_id.trim(),
          device_role: draft.device_role.trim(),
          type_fam: draft.type_fam.trim(),
          enum: draft.enum.trim(),
          evidence: draft.evidence.trim(),
        },
      ];
    });

    clearAddScopeForm();
  };

  const handleOpenRulesModal = () => {
    const rulesJson = JSON.stringify(rulesList, null, 2);

    setRulesEditorValue(rulesJson);

    dispatch(
      SetInputSlice({
        id: rulesTextAreaInputId,
        value: rulesJson,
      }),
    );

    setShowRulesModal(true);
  };

  const handleCloseRulesModal = () => {
    setShowRulesModal(false);
  };

  const handleRulesEditorChange = (value: string | undefined) => {
    const newValue = value ?? "";

    setRulesEditorValue(newValue);

    dispatch(
      SetInputSlice({
        id: rulesTextAreaInputId,
        value: newValue,
      }),
    );
  };

  const handleApplyRulesEditor = () => {
    try {
      const parsedValue = JSON.parse(rulesEditorValue);

      if (!Array.isArray(parsedValue)) return;

      setRulesList(parsedValue);
      setShowRulesModal(false);
    } catch {
      return;
    }
  };

  const handleOpenScopesModal = () => {
    const scopesJson = JSON.stringify(scopesList, null, 2);

    setScopesEditorValue(scopesJson);

    dispatch(
      SetInputSlice({
        id: scopesTextAreaInputId,
        value: scopesJson,
      }),
    );

    setShowScopesModal(true);
  };

  const handleCloseScopesModal = () => {
    setShowScopesModal(false);
  };

  const handleScopesEditorChange = (value: string | undefined) => {
    const newValue = value ?? "";

    setScopesEditorValue(newValue);

    dispatch(
      SetInputSlice({
        id: scopesTextAreaInputId,
        value: newValue,
      }),
    );
  };

  const handleApplyScopesEditor = () => {
    try {
      const parsedValue = JSON.parse(scopesEditorValue);

      if (!Array.isArray(parsedValue)) return;

      setScopesList(parsedValue);
      setShowScopesModal(false);
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

    if (currentOperation === "add_scope") {
      return JSON.stringify(
        {
          target: "kb",
          operations: scopesList.map((singleScope) => ({
            op: "add_scope",
            scope: {
              scope_id: singleScope.scope_id,
              match: {
                template_guid: singleScope.template_guid,
                device_id: singleScope.device_id,
                device_role: singleScope.device_role,
                type_fam: singleScope.type_fam,
                enum:
                  singleScope.enum.trim() === "" ||
                  singleScope.enum.trim().toLowerCase() === "null"
                    ? null
                    : singleScope.enum,
              },
              source: {
                evidence: singleScope.evidence,
              },
            },
          })),
        },
        null,
        2,
      );
    }

    if (currentOperation === "add_kb_rule") {
      return JSON.stringify(
        {
          target: "kb",
          operations: rulesList.map((singleRule) => ({
            op: "add_kb_rule",
            ...singleRule,
          })),
        },
        null,
        2,
      );
    }

    let operationPayload: Record<string, any> = {
      op: currentOperation,
    };

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
  }, [
    inputPrefix,
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
    rulesList,
    scopesList,
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
    if (currentOperation === "add_kb_rule") {
      clearAddKbRuleForm();
    }

    if (currentOperation === "add_scope") {
      clearAddScopeForm();
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
          {field.helperText ? <div style={helperStyle}>{field.helperText}</div> : null}

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

            {currentOperation === "add_scope" ? (
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
                  Scope aggiunti: <b>{scopesList.length}</b>
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
                    onClick={handleAddScope}
                    disabled={!isAddScopeDraftValid()}
                  >
                    Aggiungi scope
                  </Button>

                  <Button appearance="default" onClick={handleOpenScopesModal}>
                    Mostra scope
                  </Button>
                </div>
              </div>
            ) : null}

            {currentOperation === "add_kb_rule" ? (
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
                  Rules aggiunte: <b>{rulesList.length}</b>
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
                    onClick={handleAddKbRule}
                    disabled={!isAddKbRuleDraftValid()}
                  >
                    Aggiungi rule
                  </Button>

                  <Button appearance="default" onClick={handleOpenRulesModal}>
                    Mostra rules
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

      <Modal open={showScopesModal} onClose={handleCloseScopesModal} size="lg">
        <Modal.Header>
          <Modal.Title>Scopes preview</Modal.Title>
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
                value={scopesEditorValue}
                onChange={handleScopesEditorChange}
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
          <Button appearance="subtle" onClick={handleCloseScopesModal}>
            Chiudi
          </Button>
          <Button appearance="primary" onClick={handleApplyScopesEditor}>
            Applica
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal open={showRulesModal} onClose={handleCloseRulesModal} size="lg">
        <Modal.Header>
          <Modal.Title>Rules preview</Modal.Title>
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
                value={rulesEditorValue}
                onChange={handleRulesEditorChange}
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
          <Button appearance="subtle" onClick={handleCloseRulesModal}>
            Chiudi
          </Button>
          <Button appearance="primary" onClick={handleApplyRulesEditor}>
            Applica
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default KnowledgeBasePatchFormTag;