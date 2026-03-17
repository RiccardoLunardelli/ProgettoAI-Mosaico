interface TemplateValidateBannerTagPropsInterface {
  validateOnly: boolean;
  contentWidth: string;
  mainCardMinWidth: string;
}

function TemplateValidateBannerTag({
  validateOnly,
  contentWidth,
  mainCardMinWidth,
}: TemplateValidateBannerTagPropsInterface) {
  if (!validateOnly) return null;

  return (
    <div
      style={{
        backgroundColor: "#fff9e6",
        width: contentWidth,
        minWidth: mainCardMinWidth,
        height: "35px",
        borderRadius: "8px",
        border: "1px solid #f5dead",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: "14px",
      }}
    >
      <span
        style={{
          fontSize: "20px",
          marginLeft: "20px",
          opacity: "0.4",
          userSelect: "none",
        }}
        className="material-symbols-outlined"
      >
        warning
      </span>
      <span
        style={{
          fontSize: "13px",
          opacity: "0.8",
          marginLeft: "10px",
        }}
      >
        Modalità Validate Only attiva — Nessuna modifica verrà salvata
      </span>
    </div>
  );
}

export default TemplateValidateBannerTag;