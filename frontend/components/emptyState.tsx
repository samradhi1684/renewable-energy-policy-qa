type Props = {
  selectedModel: string;
  onQuestionClick: (question: string) => void;
};

export default function EmptyState({
  selectedModel,
  onQuestionClick,
}: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        gap: "16px",
      }}
    >
      {/* Model badge */}
      <div
        style={{
          background: "#f0faf6",
          border: "1px solid #c3e6d8",
          borderRadius: "20px",
          padding: "4px 14px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#19c37d",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {selectedModel.toUpperCase()}
      </div>

      <h1
        style={{
          fontSize: "28px",
          fontWeight: 600,
          color: "var(--foreground)",
          margin: 0,
          textAlign: "center",
        }}
      >
        Renewable Energy Policy QA
      </h1>

      <p
        style={{
          fontSize: "15px",
          color: "var(--placeholder-text)",
          margin: 0,
          textAlign: "center",
          maxWidth: "380px",
          lineHeight: "1.6",
        }}
      >
        Ask questions about renewable energy policies from DSIRE and MNRE documents.
      </p>

      {/* Suggestion chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "center",
          marginTop: "12px",
          maxWidth: "600px",
        }}
      >
        {[
          "Where are Park & Plug chargers installed?",
          "Explain VW Mitigation Program",
          "What are the total Beat the Peak savings?",
          "When are Indiana off-peak charging hours?",
        ].map((q) => (
            <button
            key={q}
            onClick={() => onQuestionClick(q)}
            style={{
                padding: "10px 16px",
                borderRadius: "12px",
                border: "1px solid var(--sidebar-border)",
                background: "var(--sidebar-bg)",
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--foreground)",
                transition: "background 0.15s",
                textAlign: "left",
                lineHeight: "1.4",
            }}
            >
            {q}
</button>
        ))}
      </div>
    </div>
  );
}
