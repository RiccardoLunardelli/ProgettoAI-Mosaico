import type { WhatIsSelcted } from "./DeviceListPageManager";

function HomeManagerPageTag({
  clickCallBack,
}: {
  clickCallBack: (whereImGoing: WhatIsSelcted) => void;
}) {
  return (
    <>
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f9fafb",
          display: "flex",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            marginTop: "100px",
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
            Device List
          </span>

          <span
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "30px",
            }}
          >
            Seleziona la modalità che vuoi aprire
          </span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(260px, 320px))",
              gap: "20px",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <div
              className="HoverTransform"
              onClick={() => {clickCallBack("enrich")}}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                border: "1px solid #e5e7eb",
                minHeight: "180px",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Enrich
              </span>

              <span
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                Apri la lista dei device con enrich attivo.
              </span>

              <span
                style={{
                  marginTop: "auto",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2563eb",
                }}
              >
                Apri pagina →
              </span>
            </div>

            <div
              className="HoverTransform"
              onClick={() => {clickCallBack("noEnrich")}}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                border: "1px solid #e5e7eb",
                minHeight: "180px",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                NoEnrich
              </span>

              <span
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                Apri la lista dei device senza enrich.
              </span>

              <span
                style={{
                  marginTop: "auto",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2563eb",
                }}
              >
                Apri pagina →
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomeManagerPageTag;
