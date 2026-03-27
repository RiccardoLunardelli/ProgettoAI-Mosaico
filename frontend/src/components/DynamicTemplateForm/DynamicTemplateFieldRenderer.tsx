import React, { lazy, Suspense } from "react";
import { Input, Panel, SelectPicker, Toggle } from "rsuite";

import { InputCaseEnum } from "../../commons/commonsEnums";
import DynamicTemplateKeyValueEditor, {
  FieldWrapper,
} from "./DynamicTemplateKeyValueEditor";
import {
  groupPropertiesByUiGroup,
  sortSchemaProperties,
} from "./dynamicTemplateHelpers";
import type {
  ObjectContentProps,
  RenderSchemaFieldParams,
} from "./dynamicTemplateTypes";
import DynamicTemplateArrayFieldPanel from "./DynamicTemplateArrayFieldPanel";

const TextInputTitleGenericTag = lazy(
  () => import("../input/GenericInput/TextInputTitleGeneric"),
);


export function renderSchemaField({
  fieldKey,
  schema,
  value,
  path,
  requiredFields = [],
  updateValueByPath,
  removeArrayItem,
  openAddArrayItemModal,
  openEditArrayItemModal,
  openAddConceptModal,
  root = false,
}: RenderSchemaFieldParams): React.ReactNode {
  if (!schema) return null;

  const type = schema.type;
  const widget = schema["ui:widget"];
  const isRequired = requiredFields.includes(fieldKey);

  if (type === "object") {
    if (widget === "keyValue") {
      return (
        <DynamicTemplateKeyValueEditor
          label={fieldKey}
          value={value ?? {}}
          keyLabel={schema["ui:keyLabel"] ?? "Key"}
          valueLabel={schema["ui:valueLabel"] ?? "Value"}
          suggestedKeys={schema["ui:suggestedKeys"] ?? []}
          required={isRequired}
          onChange={(newValue) => updateValueByPath(path, newValue)}
        />
      );
    }

    const properties = sortSchemaProperties(schema.properties ?? {});
    const groupedProperties = groupPropertiesByUiGroup(properties);

    if (!root) {
      return (
        <Panel
          bordered
          header={schema["ui:group"] ?? fieldKey}
          style={{
            background: "#fafafa",
            borderRadius: "10px",
          }}
        >
          <ObjectContent
            schema={schema}
            value={value ?? {}}
            path={path}
            groupedProperties={groupedProperties}
            updateValueByPath={updateValueByPath}
            removeArrayItem={removeArrayItem}
            openAddArrayItemModal={openAddArrayItemModal}
            openEditArrayItemModal={openEditArrayItemModal}
            openAddConceptModal={openAddConceptModal}
          />
        </Panel>
      );
    }

    return (
      <ObjectContent
        schema={schema}
        value={value ?? {}}
        path={path}
        groupedProperties={groupedProperties}
        updateValueByPath={updateValueByPath}
        removeArrayItem={removeArrayItem}
        openAddArrayItemModal={openAddArrayItemModal}
        openEditArrayItemModal={openEditArrayItemModal}
        openAddConceptModal={openAddConceptModal}
      />
    );
  }

  if (type === "array") {
    return (
      <DynamicTemplateArrayFieldPanel
        fieldKey={fieldKey}
        schema={schema}
        value={value}
        path={path}
        openAddArrayItemModal={openAddArrayItemModal}
        openEditArrayItemModal={openEditArrayItemModal}
        removeArrayItem={removeArrayItem}
        openAddConceptModal={openAddConceptModal}
      />
    );
  }

  if (type === "string") {
    if (widget === "textarea") {
      return (
        <FieldWrapper label={fieldKey} required={isRequired}>
          <Input
            as="textarea"
            rows={5}
            value={value ?? ""}
            onChange={(val) => updateValueByPath(path, val)}
          />
        </FieldWrapper>
      );
    }

    if (widget === "select" || schema.enum) {
      const data = (schema.enum ?? []).map((singleValue) => ({
        label:
          schema["ui:options"]?.labels?.[String(singleValue)] ??
          String(singleValue),
        value: singleValue,
      }));

      return (
        <FieldWrapper label={fieldKey} required={isRequired}>
          <div className="field-control-select">
            <SelectPicker
              data={data}
              value={value ?? null}
              cleanable={false}
              searchable={false}
              block
              placement="autoVerticalStart"
              style={{ width: "100%" }}
              menuStyle={{ zIndex: 20 }}
              onChange={(val) => updateValueByPath(path, val)}
            />
          </div>
        </FieldWrapper>
      );
    }

    return (
      <FieldWrapper label={fieldKey} required={isRequired}>
        <Suspense>
          <TextInputTitleGenericTag
            idInput={path.join("-")}
            title=""
            otherTitleInfo=""
            placeholder=""
            inputCase={InputCaseEnum.Insentive}
            disabled={false}
            value={value ?? ""}
            OnChange={(newValue: string) => updateValueByPath(path, newValue)}
          />
        </Suspense>
      </FieldWrapper>
    );
  }

  if (type === "number" || type === "integer") {
    if (widget === "select" || schema.enum) {
      const data = (schema.enum ?? []).map((singleValue) => ({
        label:
          schema["ui:options"]?.labels?.[String(singleValue)] ??
          String(singleValue),
        value: singleValue,
      }));

      return (
        <FieldWrapper label={fieldKey} required={isRequired}>
          <div className="field-control-select">
            <SelectPicker
              data={data}
              value={value ?? null}
              cleanable={false}
              searchable={false}
              block
              placement="autoVerticalStart"
              style={{ width: "100%" }}
              onChange={(val) => updateValueByPath(path, val)}
            />
          </div>
        </FieldWrapper>
      );
    }

    return (
      <FieldWrapper label={fieldKey} required={isRequired}>
        <Input
          type="number"
          value={value ?? ""}
          min={schema.minimum}
          max={schema.maximum}
          step={type === "integer" ? 1 : "any"}
          onChange={(val) => {
            if (val === "" || val === null || val === undefined) {
              updateValueByPath(path, 0);
              return;
            }

            let parsedValue =
              type === "integer" ? parseInt(val, 10) : Number(val);

            if (Number.isNaN(parsedValue)) {
              parsedValue = 0;
            }

            if (
              typeof schema.minimum === "number" &&
              parsedValue < schema.minimum
            ) {
              parsedValue = schema.minimum;
            }

            if (
              typeof schema.maximum === "number" &&
              parsedValue > schema.maximum
            ) {
              parsedValue = schema.maximum;
            }

            updateValueByPath(path, parsedValue);
          }}
        />
      </FieldWrapper>
    );
  }

  if (type === "boolean") {
    return (
      <FieldWrapper label={fieldKey} required={isRequired}>
        <div className="field-control-toggle">
          <Toggle
            checked={Boolean(value)}
            checkedChildren="ON"
            unCheckedChildren="OFF"
            onChange={(checked) => updateValueByPath(path, checked)}
          />
        </div>
      </FieldWrapper>
    );
  }

  return null;
}

function ObjectContent({
  schema,
  value,
  path,
  groupedProperties,
  updateValueByPath,
  removeArrayItem,
  openAddArrayItemModal,
  openEditArrayItemModal,
  openAddConceptModal,
}: ObjectContentProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {groupedProperties.map(([groupName, groupFields]) => {
        if (groupName === "__NO_GROUP__") {
          return (
            <div
              key={groupName}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {groupFields.map(([childKey, childSchema]) => (
                <div
                  key={childKey}
                  style={{
                    gridColumn:
                      childSchema["ui:widget"] === "textarea" ||
                      childSchema.type === "object" ||
                      childSchema.type === "array"
                        ? "1 / -1"
                        : "auto",
                    minWidth: 0,
                  }}
                >
                  {renderSchemaField({
                    fieldKey: childKey,
                    schema: childSchema,
                    value: value?.[childKey],
                    path: [...path, childKey],
                    requiredFields: schema.required ?? [],
                    updateValueByPath,
                    removeArrayItem,
                    openAddArrayItemModal,
                    openEditArrayItemModal,
                    openAddConceptModal,
                  })}
                </div>
              ))}
            </div>
          );
        }

        const shouldSkipOuterPanel =
          groupFields.length === 1 &&
          groupFields[0][0] === groupName &&
          groupFields[0][1].type === "object";

        if (shouldSkipOuterPanel) {
          const [childKey, childSchema] = groupFields[0];

          return (
            <div key={groupName}>
              {renderSchemaField({
                fieldKey: childKey,
                schema: childSchema,
                value: value?.[childKey],
                path: [...path, childKey],
                requiredFields: schema.required ?? [],
                updateValueByPath,
                removeArrayItem,
                openAddArrayItemModal,
                openEditArrayItemModal,
                openAddConceptModal,
              })}
            </div>
          );
        }

        return (
          <Panel
            key={groupName}
            bordered
            header={groupName}
            style={{
              background: "#ffffff",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {groupFields.map(([childKey, childSchema]) => (
                <div
                  key={childKey}
                  style={{
                    gridColumn:
                      childSchema["ui:widget"] === "textarea" ||
                      childSchema.type === "object" ||
                      childSchema.type === "array"
                        ? "1 / -1"
                        : "auto",
                    minWidth: 0,
                  }}
                >
                  {renderSchemaField({
                    fieldKey: childKey,
                    schema: childSchema,
                    value: value?.[childKey],
                    path: [...path, childKey],
                    requiredFields: schema.required ?? [],
                    updateValueByPath,
                    removeArrayItem,
                    openAddArrayItemModal,
                    openEditArrayItemModal,
                    openAddConceptModal,
                  })}
                </div>
              ))}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

export default renderSchemaField;
