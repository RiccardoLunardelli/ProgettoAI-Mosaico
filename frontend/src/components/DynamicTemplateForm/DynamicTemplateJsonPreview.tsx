import MonacoEditor from "@monaco-editor/react";

function DynamicTemplateJsonPreview({ value }: { value: string }) {
  return (
    <div
      style={{
        height: "75vh",
        minHeight: "420px",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <MonacoEditor
        height="100%"
        defaultLanguage="json"
        language="json"
        theme="vs-light"
        value={value}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          fontSize: 12,
          automaticLayout: true,
        }}
      />
    </div>
  );
}

export default DynamicTemplateJsonPreview;
