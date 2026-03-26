import React, { useEffect, useState } from "react";
import { Button, Modal } from "rsuite";
import renderSchemaField from "./DynamicTemplateFieldRenderer";
import { updateNestedValue } from "./dynamicTemplateHelpers";
import type { ArrayModalStateInterface } from "./dynamicTemplateTypes";

interface DynamicTemplateArrayModalProps {
  arrayModalState: ArrayModalStateInterface;
  closeArrayModal: () => void;
  saveArrayModal: (draftValue: any) => void;
}

function DynamicTemplateArrayModal({
  arrayModalState,
  closeArrayModal,
  saveArrayModal,
}: DynamicTemplateArrayModalProps) {
  const [draftValue, setDraftValue] = useState<any>(
    arrayModalState.initialValue,
  );

  useEffect(() => {
    if (arrayModalState.open) {
      setDraftValue(arrayModalState.initialValue);
    }
  }, [arrayModalState.open, arrayModalState.initialValue]);

  const updateDraftValueByPath = (path: (string | number)[], newValue: any) => {
    if (path.length === 0) {
      setDraftValue(newValue);
      return;
    }

    setDraftValue((prev: any) => updateNestedValue(prev ?? {}, path, newValue));
  };

  return (
    <Modal
      open={arrayModalState.open}
      onClose={closeArrayModal}
      size="lg"
      overflow
    >
      <Modal.Header>
        <Modal.Title>{arrayModalState.title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div style={{ paddingTop: "6px" }}>
          {renderSchemaField({
            fieldKey: "Item",
            schema: arrayModalState.itemSchema,
            value: draftValue,
            path: [],
            requiredFields: arrayModalState.itemSchema?.required ?? [],
            updateValueByPath: updateDraftValueByPath,
            removeArrayItem: () => undefined,
            openAddArrayItemModal: () => undefined,
            openEditArrayItemModal: () => undefined,
            root: true,
          })}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button appearance="primary" onClick={() => saveArrayModal(draftValue)}>
          Salva
        </Button>
        <Button appearance="subtle" onClick={closeArrayModal}>
          Annulla
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DynamicTemplateArrayModal;
