import { useEffect, useState } from "react";
import { Button, Modal, SelectPicker } from "rsuite";
import type { SchemasListSliceInterface } from "../../../stores/slices/Base/createTemplateSlice";

function SelectSchemaBeforeSaveModalTag({
  open,
  schemasList,
  onClose,
  onConfirm,
}: {
  open: boolean;
  schemasList: SchemasListSliceInterface[];
  onClose: () => void;
  onConfirm: (schemaId: string) => void;
}) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setSelectedSchemaId("");
    }
  }, [open]);

  const schemaOptions = (schemasList ?? []).map((singleSchema) => {
    return {
      label: `${singleSchema.name} - ${singleSchema.version}`,
      value: singleSchema.id,
    };
  });

  const selectedSchemaDetail = (schemasList ?? []).find(
    (singleSchema) => singleSchema.id === selectedSchemaId,
  );

  return (
    <Modal open={open} onClose={onClose} size="sm" overflow={false}>
      <Modal.Header>
        <Modal.Title>Seleziona schema</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Prima di salvare il template devi selezionare lo schema da
            associare.
          </div>

          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Schema
            </div>

            <SelectPicker
              data={schemaOptions}
              value={selectedSchemaId}
              onChange={(value) => {
                setSelectedSchemaId(String(value ?? ""));
              }}
              block
              cleanable={false}
              searchable
              placeholder="Seleziona uno schema"
              style={{ width: "100%" }}
            />
          </div>

          {selectedSchemaDetail ? (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "12px",
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "6px",
                }}
              >
                Dettagli schema
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                <strong>ID:</strong> {selectedSchemaDetail.id}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                <strong>Name:</strong> {selectedSchemaDetail.name}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                <strong>Version:</strong> {selectedSchemaDetail.version}
              </div>
            </div>
          ) : null}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button appearance="subtle" onClick={onClose}>
          Annulla
        </Button>

        <Button
          appearance="primary"
          onClick={() => onConfirm(selectedSchemaId)}
          disabled={!selectedSchemaId}
        >
          Salva template
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SelectSchemaBeforeSaveModalTag;
