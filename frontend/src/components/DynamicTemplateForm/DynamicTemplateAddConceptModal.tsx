import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Button, Modal } from "rsuite";
import type { ConceptModalStateInterface } from "./dynamicTemplateTypes";
import { InputCaseEnum } from "../../commons/commonsEnums";

const SelectPickerTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.SelectPicker })),
);

const TextInputTitleGenericTag = lazy(
  () => import("../input/GenericInput/TextInputTitleGeneric"),
);

interface DynamicTemplateAddConceptModalProps {
  conceptModalState: ConceptModalStateInterface;
  closeConceptModal: () => void;
  saveConceptModal: (operationPayload: Record<string, any>) => void;
}

interface AddConceptFieldInterface {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  type: "text" | "select";
  options?: { label: string; value: string }[];
}

const CATEGORY_OPTIONS = [
  { label: "measurement", value: "measurement" },
  { label: "parameter", value: "parameter" },
  { label: "alarm", value: "alarm" },
  { label: "warning", value: "warning" },
  { label: "command", value: "command" },
  { label: "virtual_variable", value: "virtual_variable" },
];

const ADD_BASE_CONCEPT_FIELDS: AddConceptFieldInterface[] = [
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
];

function DynamicTemplateAddConceptModal({
  conceptModalState,
  closeConceptModal,
  saveConceptModal,
}: DynamicTemplateAddConceptModalProps) {
  const [formValue, setFormValue] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!conceptModalState.open) return;

    setFormValue({
      category_id: conceptModalState.initialValue?.category_id ?? "",
      concept_id: conceptModalState.initialValue?.concept_id ?? "",
      semantic_category:
        conceptModalState.initialValue?.semantic_category ?? "",
      label_it: conceptModalState.initialValue?.label_it ?? "",
      label_en: conceptModalState.initialValue?.label_en ?? "",
      description: conceptModalState.initialValue?.description ?? "",
    });
  }, [conceptModalState]);

  const updateField = (key: string, value: any) => {
    setFormValue((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const operationPayload = useMemo(() => {
    return {
      op: "add_base_concept",
      category_id: formValue.category_id ?? "",
      concept_id: formValue.concept_id ?? "",
      semantic_category: formValue.semantic_category ?? "",
      label: {
        it: formValue.label_it ?? "",
        en: formValue.label_en ?? "",
      },
      description: formValue.description ?? "",
    };
  }, [formValue]);

  const patchJson = useMemo(() => {
    return {
      target: "template_base",
      operations: [operationPayload],
    };
  }, [operationPayload]);

  const jsonPreview = useMemo(() => {
    return JSON.stringify(patchJson, null, 2);
  }, [patchJson]);

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "6px",
    display: "block",
  } as const;

  const helperStyle = {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px",
    lineHeight: "1.4",
  } as const;

  const inputCardStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box" as const,
  };

  const RenderField = (field: AddConceptFieldInterface) => {
    const fieldValue = formValue[field.id] ?? "";

    if (field.type === "text") {
      return (
        <div style={inputCardStyle}>
          <Suspense fallback={null}>
            <TextInputTitleGenericTag
              idInput={`add-concept-${field.id}`}
              title={field.label}
              otherTitleInfo=""
              placeholder={field.placeholder ?? ""}
              inputCase={InputCaseEnum.Insentive}
              disabled={false}
              value={fieldValue}
              OnChange={(value: string) => {
                updateField(field.id, value);
              }}
            />
          </Suspense>

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
              placeholder="Seleziona"
              cleanable={false}
              searchable={false}
              block
              disabled
              style={{ width: "100%" }}
            />
          </Suspense>
        </div>
      );
    }

    return null;
  };

  const isFormValid = () => {
    return (
      formValue.category_id &&
      String(formValue.concept_id ?? "").trim() !== "" &&
      String(formValue.semantic_category ?? "").trim() !== "" &&
      String(formValue.label_it ?? "").trim() !== "" &&
      String(formValue.label_en ?? "").trim() !== "" &&
      String(formValue.description ?? "").trim() !== ""
    );
  };

  return (
    <Modal
      open={conceptModalState.open}
      onClose={closeConceptModal}
      size="lg"
      overflow
    >
      <Modal.Header>
        <Modal.Title>
          Add Base Concept
          {conceptModalState.sectionKey
            ? ` - ${conceptModalState.sectionKey}`
            : ""}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
              gap: "16px",
              alignItems: "start",
            }}
          >
            {ADD_BASE_CONCEPT_FIELDS.map((singleField) => (
              <div
                key={singleField.id}
                style={{
                  width: "100%",
                  minWidth: 0,
                }}
              >
                {RenderField(singleField)}
              </div>
            ))}
          </div>

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
                minHeight: "220px",
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
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={!isFormValid()}
          style={{
            opacity: isFormValid() ? 1 : 0.6,
            cursor: isFormValid() ? "pointer" : "not-allowed",
          }}
          onClick={() => saveConceptModal(operationPayload)}
        >
          Aggiungi patch
        </Button>

        <Button appearance="subtle" onClick={closeConceptModal}>
          Annulla
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DynamicTemplateAddConceptModal;
