import { useEffect, useMemo, useState } from "react";
import { Button, Panel, Tabs } from "rsuite";
import { useDispatch, useSelector } from "react-redux";

import renderSchemaField from "./DynamicTemplateFieldRenderer";
import DynamicTemplateArrayModal from "./DynamicTemplateArrayModal";
import DynamicTemplateJsonPreview from "./DynamicTemplateJsonPreview";
import DynamicTemplateAddConceptModal from "./DynamicTemplateAddConceptModal";
import DynamicTemplatePatchPreviewModal from "./DynamicTemplatePatchPreviewModal";

import {
  buildInitialValueFromRootSchema,
  buildInitialValueFromSchema,
  deepClone,
  getDefaultConceptIdBySection,
  getNestedValue,
  updateNestedValue,
} from "./dynamicTemplateHelpers";

import type {
  ArrayModalStateInterface,
  ConceptModalStateInterface,
  DynamicTemplateFormTagProps,
  SchemaProperty,
} from "./dynamicTemplateTypes";

import { SetInputSlice } from "../../stores/slices/Base/inputSlice";

function DynamicTemplateFormTag({
  schema,
  value,
  onChange,
  onSave,
  saveLabel = "Salva",
  saving = false,
}: DynamicTemplateFormTagProps) {
  const dispatch = useDispatch();

  const inputSliceValue: Record<string, string> = useSelector((state: any) => {
    return state.inputSlice?.value ?? {};
  });

  const [formValue, setFormValue] = useState<Record<string, any>>({});
  const [previewValue, setPreviewValue] = useState<string>("{}");
  const [showPatchPreviewModal, setShowPatchPreviewModal] =
    useState<boolean>(false);

  const [arrayModalState, setArrayModalState] =
    useState<ArrayModalStateInterface>({
      open: false,
      title: "",
      path: [],
      itemSchema: undefined,
      editIndex: null,
      initialValue: null,
    });

  const [conceptModalState, setConceptModalState] =
    useState<ConceptModalStateInterface>({
      open: false,
      sectionKey: "",
      initialValue: {},
    });

  useEffect(() => {
    if (value) {
      setFormValue(value);
      return;
    }

    setFormValue(buildInitialValueFromRootSchema(schema));
  }, [schema, value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPreviewValue(JSON.stringify(formValue, null, 2));
    }, 180);

    return () => clearTimeout(timeout);
  }, [formValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange?.(formValue);
    }, 120);

    return () => clearTimeout(timeout);
  }, [formValue, onChange]);

  const rootTabs = useMemo(() => {
    return Object.entries(schema).sort(([keyA, a], [keyB, b]) => {
      if (keyA === "TemplateInfo") return -1;
      if (keyB === "TemplateInfo") return 1;
      return (a["ui:order"] ?? 0) - (b["ui:order"] ?? 0);
    });
  }, [schema]);

  const patchPreviewValue = useMemo(() => {
    const rawPatch = inputSliceValue["TemplateBasePatch-TextArea"] ?? "";

    if (!rawPatch || !rawPatch.trim()) {
      return JSON.stringify(
        {
          target: "template_base",
          operations: [],
        },
        null,
        2,
      );
    }

    try {
      return JSON.stringify(JSON.parse(rawPatch), null, 2);
    } catch {
      return rawPatch;
    }
  }, [inputSliceValue]);

  const updateValueByPath = (path: (string | number)[], newValue: any) => {
    setFormValue((prev) => updateNestedValue(prev, path, newValue));
  };

  const removeArrayItem = (path: (string | number)[], index: number) => {
    setFormValue((prev) => {
      const currentArray = [...(getNestedValue(prev, path) ?? [])];
      currentArray.splice(index, 1);
      return updateNestedValue(prev, path, currentArray);
    });
  };

  const openAddArrayItemModal = (
    path: (string | number)[],
    itemSchema?: SchemaProperty,
    fieldKey?: string,
  ) => {
    setArrayModalState({
      open: true,
      title: `Aggiungi ${fieldKey ?? "elemento"}`,
      path,
      itemSchema,
      editIndex: null,
      initialValue: buildInitialValueFromSchema(itemSchema),
    });
  };

  const openEditArrayItemModal = (
    path: (string | number)[],
    itemSchema: SchemaProperty | undefined,
    index: number,
    currentValue: any,
    fieldKey?: string,
  ) => {
    setArrayModalState({
      open: true,
      title: `Modifica ${fieldKey ?? "elemento"} #${index + 1}`,
      path,
      itemSchema,
      editIndex: index,
      initialValue: deepClone(currentValue),
    });
  };

  const closeArrayModal = () => {
    setArrayModalState({
      open: false,
      title: "",
      path: [],
      itemSchema: undefined,
      editIndex: null,
      initialValue: null,
    });
  };

  const saveArrayModal = (draftValue: any) => {
    setFormValue((prev) => {
      const currentArray = [
        ...(getNestedValue(prev, arrayModalState.path) ?? []),
      ];

      if (arrayModalState.editIndex === null) {
        currentArray.push(draftValue);
      } else {
        currentArray[arrayModalState.editIndex] = draftValue;
      }

      return updateNestedValue(prev, arrayModalState.path, currentArray);
    });

    closeArrayModal();
  };

  const handleSave = () => {
    onSave?.(formValue);
  };

  const openAddConceptModal = (sectionKey: string) => {
    const defaultCategoryId = getDefaultConceptIdBySection(sectionKey);

    setConceptModalState({
      open: true,
      sectionKey,
      initialValue: {
        category_id: defaultCategoryId,
        concept_id: "",
        semantic_category: "",
        label_it: "",
        label_en: "",
        description: "",
      },
    });
  };

  const closeConceptModal = () => {
    setConceptModalState({
      open: false,
      sectionKey: "",
      initialValue: {},
    });
  };

  const appendOperationToPatchJson = (
    newOperation: Record<string, any>,
    patchInputId: string,
  ) => {
    let currentPatch: {
      target: string;
      operations: Record<string, any>[];
    } = {
      target: "template_base",
      operations: [],
    };

    try {
      const currentValue = inputSliceValue[patchInputId] ?? "";
      const parsedValue = JSON.parse(currentValue);

      currentPatch = {
        target: parsedValue?.target ?? "template_base",
        operations: Array.isArray(parsedValue?.operations)
          ? parsedValue.operations
          : [],
      };
    } catch {
      currentPatch = {
        target: "template_base",
        operations: [],
      };
    }

    const updatedPatch = {
      target: "template_base",
      operations: [...currentPatch.operations, newOperation],
    };

    dispatch(
      SetInputSlice({
        id: patchInputId,
        value: JSON.stringify(updatedPatch, null, 2),
      }),
    );
  };

  const saveConceptModal = (operationPayload: Record<string, any>) => {
    appendOperationToPatchJson(operationPayload, "TemplateBasePatch-TextArea");
    closeConceptModal();
  };

  return (
    <>
      <style>
        {`
          .dynamic-template-form .field-control-select {
            width: 100%;
            min-width: 0;
            display: block;
          }

          .dynamic-template-form .field-control-select .rs-picker,
          .dynamic-template-form .field-control-select .rs-picker-toggle-wrapper,
          .dynamic-template-form .field-control-select .rs-picker-toggle,
          .dynamic-template-form .field-control-select .rs-picker-default,
          .dynamic-template-form .field-control-select .rs-picker-select {
            width: 100% !important;
            max-width: 100% !important;
          }

          .dynamic-template-form .field-control-select .rs-picker-toggle {
            display: flex !important;
            align-items: center;
            overflow: hidden;
          }

          .dynamic-template-form .field-control-toggle {
            display: inline-flex;
            width: fit-content;
            max-width: fit-content;
            align-items: center;
          }

          .dynamic-template-form .field-control-toggle .rs-toggle {
            width: auto !important;
            display: inline-flex !important;
            flex: 0 0 auto !important;
          }

          .dynamic-template-form .field-control-toggle .rs-toggle-presentation,
          .dynamic-template-form .field-control-toggle .rs-toggle-inner {
            width: auto !important;
          }
        `}
      </style>

      <div
        className="dynamic-template-form"
        style={{
          display: "flex",
          gap: "20px",
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "0",
          }}
        >
          <Panel
            bordered
            header={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: "12px",
                }}
              >
                <span style={{ fontWeight: 600 }}>Create Template</span>

                <div>
                  <Button
                    appearance="primary"
                    onClick={handleSave}
                    loading={saving}
                  >
                    {saveLabel}
                  </Button>

                  <Button
                    appearance="default"
                    onClick={() => setShowPatchPreviewModal(true)}
                    loading={saving}
                    style={{ marginLeft: "8px" }}
                  >
                    Mostra Patches
                  </Button>
                </div>
              </div>
            }
            style={{
              background: "#ffffff",
              borderRadius: "12px",
            }}
          >
            <Tabs
              defaultActiveKey={rootTabs[0]?.[0]}
              appearance="subtle"
              style={{ width: "100%" }}
            >
              {rootTabs.map(([sectionKey, sectionSchema]) => (
                <Tabs.Tab
                  key={sectionKey}
                  eventKey={sectionKey}
                  title={sectionKey}
                >
                  <div style={{ paddingTop: "16px" }}>
                    {renderSchemaField({
                      fieldKey: sectionKey,
                      schema: sectionSchema,
                      value: formValue?.[sectionKey],
                      path: [sectionKey],
                      requiredFields: sectionSchema.required ?? [],
                      updateValueByPath,
                      removeArrayItem,
                      openAddArrayItemModal,
                      openEditArrayItemModal,
                      openAddConceptModal,
                      root: true,
                    })}
                  </div>
                </Tabs.Tab>
              ))}
            </Tabs>
          </Panel>
        </div>

        <div
          style={{
            width: "36%",
            minWidth: "340px",
            position: "sticky",
            top: "20px",
          }}
        >
          <Panel
            bordered
            header="Preview JSON"
            style={{
              background: "#ffffff",
              borderRadius: "12px",
            }}
          >
            <DynamicTemplateJsonPreview value={previewValue} />
          </Panel>
        </div>
      </div>

      <DynamicTemplateArrayModal
        arrayModalState={arrayModalState}
        closeArrayModal={closeArrayModal}
        saveArrayModal={saveArrayModal}
      />

      <DynamicTemplateAddConceptModal
        conceptModalState={conceptModalState}
        closeConceptModal={closeConceptModal}
        saveConceptModal={saveConceptModal}
      />

      <DynamicTemplatePatchPreviewModal
        open={showPatchPreviewModal}
        onClose={() => setShowPatchPreviewModal(false)}
        value={patchPreviewValue}
        onChange={(newValue) => {
          dispatch(
            SetInputSlice({
              id: "TemplateBasePatch-TextArea",
              value: newValue,
            }),
          );
        }}
      />
    </>
  );
}

export default DynamicTemplateFormTag;
