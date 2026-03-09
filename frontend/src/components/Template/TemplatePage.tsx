import { useState } from "react";

type CurrentStepNameType = "Selezione" | "Matching" | "Risultato"

interface ComponentStateInterface {
  currentStep: number;
  currentStepName: CurrentStepNameType;
}

function TemplatePageTag() {
  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      currentStep: 1,
      currentStepName: "Selezione"
    },
  );

  

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Div sopra */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "20px",
          boxSizing: "border-box",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {/* Step 1 */}
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor:
              componentState.currentStep == 1 ? "#2563eb" : "#e5e7eb",
            color: componentState.currentStep == 1 ? "#fff" : "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "14px",
            marginLeft: "30px"
          }}
        >
          1
        </div>

        <span
          className="material-symbols-outlined"
          style={{ margin: "0 8px", opacity: 0.5 }}
        >
          chevron_right
        </span>

        {/* Step 2 */}
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor:
              componentState.currentStep == 2 ? "#2563eb" : "#e5e7eb",
            color: componentState.currentStep == 2 ? "#fff" : "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          2
        </div>

        <span
          className="material-symbols-outlined"
          style={{ margin: "0 8px", opacity: 0.5 }}
        >
          chevron_right
        </span>

        {/* Step 3 */}
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor:
              componentState.currentStep == 3 ? "#2563eb" : "#e5e7eb",
            color: componentState.currentStep == 3 ? "#fff" : "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          3
        </div>

        {/* Label */}
        <span
          style={{
            marginLeft: "12px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          {componentState.currentStepName}
        </span>
      </div>

      {/* Div sotto */}
      <div
        style={{
          display: "flex",
          width: "100%",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div style={{marginLeft: "30px"}}>
            asda
        </div>
      </div>
    </div>
  );
}

export default TemplatePageTag;
