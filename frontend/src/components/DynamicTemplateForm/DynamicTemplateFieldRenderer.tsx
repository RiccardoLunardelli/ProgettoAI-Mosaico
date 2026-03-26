import React, { lazy, Suspense } from "react";
import { Button, Input, Panel, SelectPicker, Table, Toggle } from "rsuite";
import { Plus } from "@rsuite/icons";
import { InputCaseEnum } from "../../commons/commonsEnums";
import DynamicTemplateKeyValueEditor, {
  FieldWrapper,
} from "./DynamicTemplateKeyValueEditor";
import {
  getArrayItemDescription,
  getArrayItemTitle,
  getArrayItemTypeLabel,
  groupPropertiesByUiGroup,
  sortSchemaProperties,
} from "./dynamicTemplateHelpers";
import type {
  ObjectContentProps,
  RenderSchemaFieldParams,
} from "./dynamicTemplateTypes";

const TextInputTitleGenericTag = lazy(
  () => import("../input/GenericInput/TextInputTitleGeneric"),
);

const { Column, HeaderCell, Cell } = Table;

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
      />
    );
  }

  if (type === "array") {
    const arrayValue = Array.isArray(value) ? value : [];

    return (
      <Panel
        bordered
        header={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span>{fieldKey}</span>

            <Button
              appearance="primary"
              size="sm"
              startIcon={<Plus />}
              onClick={() =>
                openAddArrayItemModal(path, schema.items, fieldKey)
              }
            >
              Aggiungi
            </Button>
          </div>
        }
        style={{
          background: "#fafafa",
          borderRadius: "10px",
        }}
      >
        {arrayValue.length === 0 ? (
          <div
            style={{
              color: "#6b7280",
              fontSize: "13px",
              padding: "12px 0",
            }}
          >
            Nessun elemento presente
          </div>
        ) : (
          <Table
            data={arrayValue.map((item, index) => ({
              ...item,
              __rowIndex: index,
              __title: getArrayItemTitle(item, fieldKey, index),
              __description: getArrayItemDescription(item),
              __typeLabel: getArrayItemTypeLabel(item),
            }))}
            autoHeight
            bordered
            cellBordered
            rowHeight={46}
            headerHeight={42}
          >
            <Column flexGrow={1.5} minWidth={220}>
              <HeaderCell>Nome</HeaderCell>
              <Cell dataKey="__title" />
            </Column>

            <Column flexGrow={2} minWidth={240}>
              <HeaderCell>Descrizione</HeaderCell>
              <Cell dataKey="__description" />
            </Column>

            <Column flexGrow={1} minWidth={140}>
              <HeaderCell>Tipo</HeaderCell>
              <Cell dataKey="__typeLabel" />
            </Column>

            <Column width={170} align="center" fixed="right">
              <HeaderCell>Azioni</HeaderCell>
              <Cell>
                {(rowData: any) => (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      height: "100%",
                    }}
                  >
                    <Button
                      appearance="ghost"
                      size="xs"
                      onClick={() =>
                        openEditArrayItemModal(
                          path,
                          schema.items,
                          rowData.__rowIndex,
                          arrayValue[rowData.__rowIndex],
                          fieldKey,
                        )
                      }
                    >
                      Modifica
                    </Button>

                    <Button
                      appearance="ghost"
                      color="red"
                      size="xs"
                      onClick={() => removeArrayItem(path, rowData.__rowIndex)}
                    >
                      Elimina
                    </Button>
                  </div>
                )}
              </Cell>
            </Column>
          </Table>
        )}
      </Panel>
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

  if (type === "number") {
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
          onChange={(val) => {
            if (val === "" || val === null || val === undefined) {
              updateValueByPath(path, 0);
              return;
            }

            const parsedValue = Number(val);
            updateValueByPath(
              path,
              Number.isNaN(parsedValue) ? 0 : parsedValue,
            );
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