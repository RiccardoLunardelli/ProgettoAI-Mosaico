import { lazy, Suspense, useEffect, useState } from "react";
import { Modal } from "rsuite";

const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

interface DynamicTemplatePatchPreviewModalProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange?: (val: string) => void; // 👈 importante
}

function DynamicTemplatePatchPreviewModal({
  open,
  onClose,
  value,
  onChange,
}: DynamicTemplatePatchPreviewModalProps) {
  const [editorValue, setEditorValue] = useState<string>("");

  useEffect(() => {
    if (open) {
      setEditorValue(value);
    }
  }, [open, value]);

  const handleChange = (val: string | undefined) => {
    const newValue = val ?? "";
    setEditorValue(newValue);
    onChange?.(newValue);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" overflow={false}>
      <Modal.Header>
        <Modal.Title>Preview Patches</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div
          style={{
            height: "65vh",
            minHeight: "420px",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          <Suspense
            fallback={<div style={{ padding: "16px" }}>Caricamento editor...</div>}
          >
            <MonacoEditorTag
              height="100%"
              defaultLanguage="json"
              value={editorValue}
              onChange={handleChange}
              options={{
                readOnly: false, 
                minimap: { enabled: false },
                formatOnPaste: true,
                formatOnType: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </Suspense>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "#1675e0",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Chiudi
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default DynamicTemplatePatchPreviewModal;