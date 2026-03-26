import type { RootSchema, SchemaProperty } from "./dynamicTemplateTypes";

export function sortSchemaProperties(
  properties: Record<string, SchemaProperty>,
): [string, SchemaProperty][] {
  return Object.entries(properties).sort(([keyA, a], [keyB, b]) => {
    if (keyA === "TemplateInfo") return -1;
    if (keyB === "TemplateInfo") return 1;
    return (a["ui:order"] ?? 0) - (b["ui:order"] ?? 0);
  });
}

export function groupPropertiesByUiGroup(
  properties: [string, SchemaProperty][],
): [string, [string, SchemaProperty][]][] {
  const hasExplicitGroups = properties.some(([, propertySchema]) =>
    Boolean(propertySchema["ui:group"]),
  );

  if (!hasExplicitGroups) {
    return [["__NO_GROUP__", properties]];
  }

  const grouped = properties.reduce<Record<string, [string, SchemaProperty][]>>(
    (acc, current) => {
      const groupName = current[1]["ui:group"] ?? "Generale";

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push(current);
      return acc;
    },
    {},
  );

  const priorityGroups = ["TemplateInfo", "Informazioni principali"];

  return Object.entries(grouped).sort(([groupA], [groupB]) => {
    const indexA = priorityGroups.indexOf(groupA);
    const indexB = priorityGroups.indexOf(groupB);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return 0;
  });
}

export function buildInitialValueFromRootSchema(
  schema: RootSchema,
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(schema).forEach(([key, schemaValue]) => {
    result[key] = buildInitialValueFromSchema(schemaValue);
  });

  return result;
}

export function buildInitialValueFromSchema(schema?: SchemaProperty): any {
  if (!schema) return null;

  if (schema.type === "object") {
    if (schema["ui:widget"] === "keyValue") {
      return {};
    }

    const result: Record<string, any> = {};
    Object.entries(schema.properties ?? {}).forEach(([key, propSchema]) => {
      result[key] = buildInitialValueFromSchema(propSchema);
    });
    return result;
  }

  if (schema.type === "array") {
    return [];
  }

  if (schema.type === "string") {
    return "";
  }

  if (schema.type === "number") {
    return 0;
  }

  if (schema.type === "boolean") {
    return false;
  }

  return null;
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function getNestedValue(obj: any, path: (string | number)[]) {
  if (!path.length) return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}

export function updateNestedValue(
  obj: any,
  path: (string | number)[],
  value: any,
): any {
  if (path.length === 0) return value;

  const [head, ...rest] = path;

  if (Array.isArray(obj)) {
    const newArray = [...obj];
    newArray[Number(head)] = updateNestedValue(
      newArray[Number(head)],
      rest,
      value,
    );
    return newArray;
  }

  return {
    ...(obj ?? {}),
    [head]: rest.length ? updateNestedValue(obj?.[head], rest, value) : value,
  };
}

export function getArrayItemTitle(item: any, fieldKey: string, index: number) {
  if (item?.name && String(item.name).trim()) return String(item.name);
  if (item?.Label && String(item.Label).trim()) return String(item.Label);
  if (item?.Parameter?.Label && String(item.Parameter.Label).trim()) {
    return String(item.Parameter.Label);
  }
  return `${fieldKey} #${index + 1}`;
}

export function getArrayItemDescription(item: any) {
  if (item?.Description && String(item.Description).trim()) {
    return String(item.Description);
  }

  if (
    item?.Variable?.MultiLanguageDescription?.it &&
    String(item.Variable.MultiLanguageDescription.it).trim()
  ) {
    return String(item.Variable.MultiLanguageDescription.it);
  }

  if (
    item?.Variable?.MultiLanguageDescription?.en &&
    String(item.Variable.MultiLanguageDescription.en).trim()
  ) {
    return String(item.Variable.MultiLanguageDescription.en);
  }

  return "-";
}

export function getArrayItemTypeLabel(item: any) {
  if (item?.Variable?.Type !== undefined && item?.Variable?.Type !== null) {
    return getVariableTypeLabel(item.Variable.Type);
  }

  if (item?.Modbus?.RegisterType) {
    return String(item.Modbus.RegisterType);
  }

  return "-";
}

export function getVariableTypeLabel(typeValue: number) {
  const labels: Record<number, string> = {
    0: "Boolean",
    1: "SByte",
    2: "Byte",
    3: "Int16",
    4: "UInt16",
    5: "Int32",
    6: "UInt32",
    7: "Int64",
    8: "UInt64",
    9: "Single",
    10: "Double",
    11: "DateTime",
    12: "String",
  };

  return labels[typeValue] ?? String(typeValue);
}