interface TemplateStepperTagPropsInterface {
  currentStep: number;
  currentStepName: string;
}

function TemplateStepperTag({
  currentStep,
  currentStepName,
}: TemplateStepperTagPropsInterface) {
  const GetStepStyle = (stepNumber: number) => {
    const isCompleted = currentStep > stepNumber;
    const isCurrent = currentStep === stepNumber;

    return {
      backgroundColor: isCompleted
        ? "#22c55e"
        : isCurrent
          ? "#2563eb"
          : "#e5e7eb",
      color: isCompleted || isCurrent ? "#fff" : "#6b7280",
    };
  };

  return (
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
      {[1, 2, 3, 4, 5, 6, 7].map((step, index) => (
        <div
          key={step}
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              ...GetStepStyle(step),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "14px",
              marginLeft: index === 0 ? "30px" : "0",
            }}
          >
            {step}
          </div>

          {step < 7 && (
            <span
              className="material-symbols-outlined"
              style={{ margin: "0 8px", opacity: 0.5 }}
            >
              chevron_right
            </span>
          )}
        </div>
      ))}

      <span
        style={{
          marginLeft: "12px",
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        {currentStepName}
      </span>
    </div>
  );
}

export default TemplateStepperTag;