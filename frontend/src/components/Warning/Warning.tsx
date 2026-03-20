function WarningTag() {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: "10px",
        border: "1px solid #f5c27a",
        backgroundColor: "#fff8e8",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        boxSizing: "border-box",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "20px",
          color: "#c27a00",
          opacity: "0.8",
          userSelect: "none",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        warning
      </span>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          color: "#7a4b00",
          fontSize: "13px",
          lineHeight: "1.45",
        }}
      >
        <span style={{ fontWeight: 700 }}>Attenzione</span>

        <span>
          Se aggiungi un concetto, deve essere presente anche nel Template Base.
        </span>

        <span>
          Campi come <b>concept_id</b>, <b>category</b> e{" "}
          <b>semantic_category</b> devono corrispondere per mantenere la
          relazione tra i due artifact.
        </span>
      </div>
    </div>
  );
}

export default WarningTag;