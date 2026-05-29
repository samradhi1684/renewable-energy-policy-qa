"use client";

import { useState } from "react";
import type { Source } from "../lib/api";

type Props = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  onSourceClick?: (
    sources: Source[],
    index: number
  ) => void;
  onRegenerate?: () => void;
};

export default function MessageBubble({
  role,
  content,
  sources,
  onSourceClick,
  onRegenerate,
}: Props) {

  const [speaking, setSpeaking] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  function toggleSpeech() {

    if (
      typeof window ===
      "undefined"
    ) return;

    if (speaking) {

      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        content
      );

    utterance.lang =
      "en-US";

    utterance.rate = 1;

    utterance.onend =
      () =>
        setSpeaking(
          false
        );

    setSpeaking(true);

    speechSynthesis.speak(
      utterance
    );
  }

  async function copyText() {

    await navigator.clipboard.writeText(
      content
    );

    setCopied(true);

    setTimeout(
      () =>
        setCopied(
          false
        ),
      1200
    );
  }

  if (
    role === "user"
  ) {
    return (
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "flex-end",
        }}
      >
        <div
          style={{
            maxWidth:
              "80%",
            background:
              "var(--user-bubble-bg)",
            color:
              "var(--user-bubble-text)",
            borderRadius:
              "18px 18px 4px 18px",
            padding:
              "10px 16px",
            fontSize:
              14,
            lineHeight:
              1.6,
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display:
          "flex",
        flexDirection:
          "column",
        gap: 8,
      }}
    >
      {/* Answer */}
      <div
        style={{
          color:
            "var(--assistant-text)",
          fontSize:
            14,
          lineHeight:
            1.75,
          whiteSpace:
            "pre-wrap",
        }}
      >
        {content}
      </div>

      {/* ChatGPT-style actions */}
      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap: 14,
          marginTop: 2,
        }}
      >
        {/* Copy */}
        <button
          onClick={
            copyText
          }
          title="Copy"
          style={iconBtn}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
            />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>

          {copied
            ? "Copied"
            : ""}
        </button>

        {/* TTS */}
        <button
          onClick={
            toggleSpeech
          }
          title={
            speaking
              ? "Stop"
              : "Read aloud"
          }
          style={{
            ...iconBtn,
            opacity:
              speaking
                ? 1
                : 0.75,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
          {/* Regenerate */}
      {onRegenerate && (
        <button
          onClick={
            onRegenerate
          }
          title="Regenerate answer"
          style={iconBtn}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.5 9a9 9 0 0 1 14.13-3.36L23 10" />
            <path d="M20.5 15a9 9 0 0 1-14.13 3.36L1 14" />
          </svg>

  
        </button>
      )}
              {/* Sources */}
        {sources &&
          sources.length >
            0 && (
            <button
              onClick={() =>
                onSourceClick?.(
                  sources,
                  0
                )
              }
              title="Sources"
              style={iconBtn}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2z" />
                <path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6z" />
              </svg>

              Sources
            </button>
          )}
      </div>
    </div>
  );
}

const iconBtn = {
  display:
    "inline-flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  gap: 6,
  border: "none",
  background:
    "transparent",
  cursor: "pointer",
  color:
    "var(--placeholder-text)",
  fontSize: 13,
  padding: 0,
  opacity: 0.75,
  transition:
    "opacity 0.15s ease",
};