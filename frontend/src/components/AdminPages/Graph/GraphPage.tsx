import { lazy, Suspense, useMemo } from "react";
import type { WhatGraphSelected } from "./GraphPageManager";

const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

function GraphPageTag({
  whatIsSelected,
  goBackCallBack,
}: {
  whatIsSelected: WhatGraphSelected;
  goBackCallBack: () => void;
}) {
  const graphInfo = useMemo(() => {
    if (whatIsSelected === "metrics") {
      return {
        title: "Grafici per metriche",
        description:
          "Dashboard principale con metriche template, dizionario e score.",
        src: "http://172.27.200.118:3001/d/afge44a70kkcgf/grafici-per-metriche-copy?orgId=1&from=1773896756450&to=1773918356451&theme=light",
      };
    }

    if (whatIsSelected === "llm") {
      return {
        title: "LLM Dashboard",
        description:
          "Dashboard dedicata alle metriche e al comportamento del modello LLM.",
        src: "http://172.27.200.118:3001/d/ffdth48d4rfnkb/llm-dashboard?orgId=1&from=1773313848981&to=1773918648981&theme=light",
      };
    }

    return {
      title: "",
      description: "",
      src: "",
    };
  }, [whatIsSelected]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#f9fafb",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "1600px",
          display: "flex",
          flexDirection: "column",
          padding: "30px",
          boxSizing: "border-box",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "20px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#111827",
                marginBottom: "10px",
              }}
            >
              {graphInfo.title}
            </span>

            <span
              style={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              {graphInfo.description}
            </span>
          </div>

          <Suspense fallback="">
            <BasicButtonGenericTag
              textToSee="Torna indietro"
              clickCallBack={goBackCallBack}
            />
          </Suspense>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <iframe
            src={graphInfo.src}
            width="100%"
            height="100%"
            style={{
              border: "none",
              borderRadius: "10px",
            }}
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default GraphPageTag;