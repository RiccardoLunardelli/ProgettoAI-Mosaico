function RunsListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
      {/* Titolo */}
      <div
        style={{
          width: "120px",
          height: "20px",
          borderRadius: "6px",
          backgroundColor: "#e5e7eb",
          animation: "pulse 1.5s infinite",
        }}
      />

      {/* Card */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "#e5e7eb",
            animation: "pulse 1.5s infinite",
          }}
        />
      ))}

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

export default RunsListSkeleton