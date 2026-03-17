import { lazy, Suspense } from "react";

const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

interface TemplateStepResultTagPropsInterface {
  runId: string;
  isRunDisabled: boolean;
  contentWidth: string;
  mainCardMinWidth: string;
  onExecuteRun: () => void;
}

function TemplateStepResultTag({
  runId,
  isRunDisabled,
  contentWidth,
  mainCardMinWidth,
  onExecuteRun,
}: TemplateStepResultTagPropsInterface) {
  return (
    <>
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
          width: contentWidth,
          minWidth: mainCardMinWidth,
          minHeight: "240px",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "10px",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "20px", fontWeight: 600 }}>
            Esegui Run
          </span>

          <div
            style={{
              width: "100%",
              marginTop: "18px",
              backgroundColor: "#eef4ff",
              border: "1px solid #bcd0ee",
              borderRadius: "4px",
              padding: "8px 12px",
              boxSizing: "border-box",
              fontSize: "14px",
              color: "#2563eb",
            }}
          >
            # Run ID: {runId || "-"}
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            <Suspense fallback="">
              <BasicButtonGenericTag
                textToSee="Esegui Run"
                disabledButton={isRunDisabled}
                clickCallBack={onExecuteRun}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}

export default TemplateStepResultTag;