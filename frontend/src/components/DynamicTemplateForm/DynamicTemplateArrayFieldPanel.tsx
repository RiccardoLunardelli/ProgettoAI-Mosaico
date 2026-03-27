import { Button, Panel, Table } from "rsuite";
import { Plus } from "@rsuite/icons";
import {
  getArrayItemAddress,
  getArrayItemDescription,
  getArrayItemTitle,
  getArrayItemTypeLabel,
} from "./dynamicTemplateHelpers";
import type { SchemaProperty } from "./dynamicTemplateTypes";

const { Column, HeaderCell, Cell } = Table;

interface DynamicTemplateArrayFieldPanelProps {
  fieldKey: string;
  schema?: SchemaProperty;
  value: any;
  path: (string | number)[];
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
  removeArrayItem: (path: (string | number)[], index: number) => void;
  openAddConceptModal: (sectionKey: string) => void;
}

function DynamicTemplateArrayFieldPanel({
  fieldKey,
  schema,
  value,
  path,
  openAddArrayItemModal,
  openEditArrayItemModal,
  removeArrayItem,
  openAddConceptModal,
}: DynamicTemplateArrayFieldPanelProps) {
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Button
              appearance="ghost"
              size="sm"
              onClick={() => openAddConceptModal(fieldKey)}
            >
              Add concept
            </Button>

            <Button
              appearance="primary"
              size="sm"
              startIcon={<Plus />}
              onClick={() =>
                openAddArrayItemModal(path, schema?.items, fieldKey)
              }
            >
              Aggiungi
            </Button>
          </div>
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
            __address: getArrayItemAddress(item),
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

          <Column flexGrow={2} minWidth={240}>
            <HeaderCell>Address</HeaderCell>
            <Cell dataKey="__address" />
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
                    flexWrap: "wrap",
                    padding: "4px 0",
                  }}
                >
                  <Button
                    appearance="ghost"
                    size="xs"
                    onClick={() =>
                      openEditArrayItemModal(
                        path,
                        schema?.items,
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

export default DynamicTemplateArrayFieldPanel;