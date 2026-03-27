export interface SchemaProperty {
  type?: string;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  required?: string[];
  enum?: (string | number)[];
  additionalProperties?: SchemaProperty;
  minimum?: number;
  maximum?: number;

  "ui:group"?: string;
  "ui:order"?: number;
  "ui:widget"?: string;
  "ui:keyLabel"?: string;
  "ui:valueLabel"?: string;
  "ui:suggestedKeys"?: string[];
  "ui:options"?: {
    labels?: Record<string, string>;
  };
}

export interface RootSchema {
  [key: string]: SchemaProperty;
}

export interface DynamicTemplateFormTagProps {
  schema: RootSchema;
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => void;
  onSave?: (value: Record<string, any>) => void | Promise<void>;
  saveLabel?: string;
  saving?: boolean;
}

export interface ArrayModalStateInterface {
  open: boolean;
  title: string;
  path: (string | number)[];
  itemSchema?: SchemaProperty;
  editIndex: number | null;
  initialValue: any;
}

export interface RenderSchemaFieldParams {
  fieldKey: string;
  schema?: SchemaProperty;
  value: any;
  path: (string | number)[];
  requiredFields?: string[];
  updateValueByPath: (path: (string | number)[], newValue: any) => void;
  removeArrayItem: (path: (string | number)[], index: number) => void;
  openAddArrayItemModal: (
    path: (string | number)[],
    itemSchema?: SchemaProperty,
    fieldKey?: string,
  ) => void;
  openEditArrayItemModal: (
    path: (string | number)[],
    itemSchema: SchemaProperty | undefined,
    index: number,
    currentValue: any,
    fieldKey?: string,
  ) => void;
  openAddConceptModal: (
    sectionKey: string,
    rowIndex: number,
    rowData: any,
  ) => void;
  root?: boolean;
}

export interface ObjectContentProps {
  schema: SchemaProperty;
  value: Record<string, any>;
  path: (string | number)[];
  groupedProperties: [string, [string, SchemaProperty][]][];
  updateValueByPath: (path: (string | number)[], newValue: any) => void;
  removeArrayItem: (path: (string | number)[], index: number) => void;
  openAddArrayItemModal: (
    path: (string | number)[],
    itemSchema?: SchemaProperty,
    fieldKey?: string,
  ) => void;
  openEditArrayItemModal: (
    path: (string | number)[],
    itemSchema: SchemaProperty | undefined,
    index: number,
    currentValue: any,
    fieldKey?: string,
  ) => void;
  openAddConceptModal: (
    sectionKey: string,
    rowIndex: number,
    rowData: any,
  ) => void;
}

export interface ConceptModalStateInterface {
  open: boolean;
  sectionKey: string;
  rowIndex: number | null;
  rowData: any;
  initialValue: Record<string, any>;
}