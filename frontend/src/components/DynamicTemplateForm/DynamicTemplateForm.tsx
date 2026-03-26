import React, { useEffect, useMemo, useState } from "react";
import { Button, Panel, Tabs } from "rsuite";
import renderSchemaField from "./DynamicTemplateFieldRenderer";
import DynamicTemplateArrayModal from "./DynamicTemplateArrayModal";
import DynamicTemplateJsonPreview from "./DynamicTemplateJsonPreview";
import {
  buildInitialValueFromRootSchema,
  buildInitialValueFromSchema,
  deepClone,
  getNestedValue,
  updateNestedValue,
} from "./dynamicTemplateHelpers";
import type {
  ArrayModalStateInterface,
  DynamicTemplateFormTagProps,
  SchemaProperty,
} from "./dynamicTemplateTypes";

function DynamicTemplateFormTag({
  schema,
  value,
  onChange,
  onSave,
  saveLabel = "Salva",
  saving = false,
}: DynamicTemplateFormTagProps) {
  const [formValue, setFormValue] = useState<Record<string, any>>({});
  const [previewValue, setPreviewValue] = useState<string>("{}");
  const [arrayModalState, setArrayModalState] =
    useState<ArrayModalStateInterface>({
      open: false,
      title: "",
      path: [],
      itemSchema: undefined,
      editIndex: null,
      initialValue: null,
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
                <span style={{fontWeight: 600}}>Create Template</span>

                <Button
                  appearance="primary"
                  onClick={handleSave}
                  loading={saving}
                >
                  {saveLabel}
                </Button>
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
    </>
  );
}

export default DynamicTemplateFormTag;