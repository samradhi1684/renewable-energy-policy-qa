"use client";

import type { Source } from "../lib/api";

type Props = {
  sources: Source[];
  activeIndex: number;
  onSelectSource: (index: number) => void;
  onClose: () => void;
};

export default function SourcePane({
  sources,
  activeIndex,
  onSelectSource,
  onClose,
}: Props) {
  const active = sources[activeIndex];

  return (
    <div
      style={{
        width: 360,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--sidebar-border)",
        background: "var(--sidebar-bg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: "1px solid var(--sidebar-border)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
          Sources ({sources.length})
        </span>
        <button
          onClick={onClose}
          title="Close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--placeholder-text)",
            padding: "2px 6px",
            borderRadius: 6,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Source tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "10px 12px",
          borderBottom: "1px solid var(--sidebar-border)",
          flexShrink: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {sources.map((src, i) => (
          <button
            key={src.chunk_id}
            onClick={() => onSelectSource(i)}
            title={src.document_id}
            style={{
              flexShrink: 0,
              padding: "4px 10px",
              borderRadius: 20,
              border: "1px solid",
              borderColor: i === activeIndex ? "var(--accent)" : "var(--sidebar-border)",
              background: i === activeIndex ? "var(--accent)" : "transparent",
              color: i === activeIndex ? "#fff" : "var(--foreground)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              maxWidth: 130,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {i + 1}. {src.document_id.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Active source */}
      {active && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

          {/* Doc name + score */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 2 }}>
                {active.document_id.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: 11, color: "var(--placeholder-text)" }}>
                Tokens {active.token_start}–{active.token_end}
              </div>
            </div>
            <ScoreBadge score={active.score} />
          </div>

          {/* Full chunk — evidence sentences highlighted */}
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.8,
              color: "var(--foreground)",
              background: "var(--background)",
              borderRadius: 8,
              padding: "12px 14px",
              border: "1px solid var(--sidebar-border)",
            }}
            dangerouslySetInnerHTML={{
            // __html: buildHighlightedChunk(
            //   active.chunk_text,
            //   active.highlight_start,
            //   active.highlight_end
            // ),
            __html: buildHighlightedChunk(
            active.chunk_text,
            active.highlight_spans ?? []
          )
          }}
          />
        </div>
      )}
    </div>
  );
}

// ── Highlight evidence inside the full chunk ──────────────────────────────────

function buildHighlightedChunk(
  chunkText: string,
  highlights: {
    start: number;
    end: number;
  }[]
): string {

  if (!highlights.length) {
    return escapeHtml(chunkText);
  }

  // sort
  const sorted = [...highlights]
    .filter(
      h =>
        h.start >= 0 &&
        h.end > h.start
    )
    .sort(
      (a, b) => a.start - b.start
    );

  // merge overlaps
  const merged: {
    start: number;
    end: number;
  }[] = [];

  for (const h of sorted) {

    const last =
      merged[merged.length - 1];

    if (
      last &&
      h.start <= last.end
    ) {
      // overlap -> extend
      last.end = Math.max(
        last.end,
        h.end
      );
    } else {
      merged.push({
        ...h
      });
    }
  }

  let result = "";
  let current = 0;

  for (const h of merged) {

    // normal text
    result += escapeHtml(
      chunkText.slice(
        current,
        h.start
      )
    );

    // highlighted text
    result += `
      <mark style="
        background:#fef08a;
        border-radius:3px;
        padding:1px 2px;
        font-weight:500;
      ">
        ${escapeHtml(
          chunkText.slice(
            h.start,
            h.end
          )
        )}
      </mark>
    `;

    current = h.end;
  }

  // remaining text
  result += escapeHtml(
    chunkText.slice(current)
  );

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const pct    = Math.round(score * 100);
  const color  = pct >= 80 ? "#16a34a" : pct >= 60 ? "#ca8a04" : "#dc2626";
  const bg     = pct >= 80 ? "#f0fdf4" : pct >= 60 ? "#fefce8" : "#fef2f2";
  const border = pct >= 80 ? "#bbf7d0" : pct >= 60 ? "#fde68a" : "#fecaca";
  return (
    <div
      style={{
        flexShrink: 0,
        padding: "3px 8px",
        borderRadius: 20,
        background: bg,
        border: `1px solid ${border}`,
        fontSize: 11,
        fontWeight: 700,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {pct}% match
    </div>
  );
}
