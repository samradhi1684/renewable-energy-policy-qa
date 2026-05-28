"use client";

import { useState } from "react";
import type { Source } from "../lib/api";

type Props = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export default function MessageBubble({ role, content, sources }: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  if (role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: "70%",
            background: "var(--user-bubble-bg)",
            color: "var(--user-bubble-text)",
            borderRadius: "18px",
            padding: "12px 18px",
            fontSize: "15px",
            lineHeight: "1.6",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      {/* Assistant avatar */}
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "#19c37d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 41 41" fill="none">
          <path
            d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-7.504-3.357 10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.504 3.357 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.814z"
            fill="#fff"
          />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Answer text */}
        <div
          style={{
            fontSize: "15px",
            lineHeight: "1.75",
            color: "var(--assistant-text)",
            whiteSpace: "pre-wrap",
          }}
        >
          {content}
        </div>

        {/* Sources collapsible */}
        {sources && sources.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            <button
              onClick={() => setSourcesOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "20px",
                border: "1px solid var(--sources-border)",
                background: "var(--sources-bg)",
                cursor: "pointer",
                fontSize: "13px",
                color: "#555",
                fontWeight: 500,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {sources.length} source{sources.length > 1 ? "s" : ""}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: sourcesOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {sourcesOpen && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {sources.map((src, i) => (
                  <div
                    key={src.chunk_id}
                    style={{
                      background: "var(--sources-bg)",
                      border: "1px solid var(--sources-border)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--accent)",
                        }}
                      >
                        Document {src.document_id}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--placeholder-text)",
                          background: "#eee",
                          borderRadius: "12px",
                          padding: "2px 8px",
                        }}
                      >
                        Score: {(src.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#444",
                        lineHeight: "1.6",
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {src.chunk_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
