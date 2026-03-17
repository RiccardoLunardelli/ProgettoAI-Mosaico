import { lazy, Suspense } from "react";
import ollamaLogo from "../../../../public/logo/ollama.png"

const ProgressTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Progress })),
);

interface TemplateLoaderOverlayTagPropsInterface {
  show: boolean;
  percent: number;
}

function TemplateLoaderOverlayTag({
  show,
  percent,
}: TemplateLoaderOverlayTagPropsInterface) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255, 255, 255, 0.30)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "all",
      }}
    >
      <div
        style={{
          minWidth: "320px",
          padding: "24px 28px",
          borderRadius: "16px",
          backgroundColor: "rgba(255,255,255,0.92)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <img
          src={ollamaLogo}
          style={{
            width: "70px",
            height: "70px",
            objectFit: "contain",
          }}
        />

        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          Risoluzione ambiguità...
        </span>

        <div className="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div style={{ width: "240px" }}>
          <Suspense fallback="">
            <ProgressTag percent={percent} showInfo={true} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default TemplateLoaderOverlayTag;