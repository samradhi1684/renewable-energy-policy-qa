"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./messageBubble";
import type { Source } from "../lib/api";

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  created_at?: string;
};

type Props = {
  messages: Message[];
  loading: boolean;
  onSourceClick: (
    sources: Source[],
    index: number
  ) => void;
  onRegenerate: (
    index: number
  ) => void;
  onEditMessage?: (
  index: number
) => void;

  editingMessageId?: string | null;

  editingText?: string;

  onEditTextChange?: (
    value: string
  ) => void;

  onSaveEdit?: () => void;
};

export default function ChatWindow({
  messages,
  loading,
  onSourceClick,
  onRegenerate,
  onEditMessage,
  editingMessageId,
  editingText,
  onEditTextChange,
  onSaveEdit,
}: Props) {

  const bottomRef =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const regenerating =
    messages.some(
      (m) =>
        m.content ===
        "__loading__"
    );

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding:
          "40px 48px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 980,
width: "100%",
          margin:
            "0 auto",
          display:
            "flex",
          flexDirection:
            "column",
          gap: 36,
        }}
      >

        {/* Hide loading placeholder during regenerate */}
        {messages
          .filter(
            (msg) =>
              msg.content !==
              "__loading__"
          )
          .map(
            (msg, i) => (
              <div key={msg.id || i} className="message-enter">
                <MessageBubble
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                  created_at={msg.created_at}
                  onSourceClick={onSourceClick}
                  onRegenerate={() => onRegenerate(i)}
                  onEdit={
                    msg.role === "user"
                      ? () => {
                          console.log("CHATWINDOW", i);
                          onEditMessage?.(i);
                        }
                      : undefined
                  }
                  isEditing={msg.id === editingMessageId}
                  editText={editingText}
                  onEditTextChange={onEditTextChange}
                  onSaveEdit={onSaveEdit}
                />
              </div>
            )
          )}

        {/* Typing dots for BOTH initial + regenerate */}
        {loading && (
          <div
            style={{
              display:
                "flex",
              gap: 12,
              alignItems:
                "flex-start",
            }}
          >
            {/* Assistant avatar */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius:
                  "50%",
                background:
                  "linear-gradient(135deg,#6366F1,#4F46E5)",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>

            {/* Three dots */}
            <div
             
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          padding: "14px 18px",
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "18px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}

            >
              {[0,1,2].map(
                (i) => (
                  <span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius:
                        "50%",
                      background:
                        "var(--placeholder-text)",
                      display:
                        "inline-block",
                      animation:
                        "bounce 1.2s infinite",
                      animationDelay:
                        `${i * 0.2}s`,
                    }}
                  />
                )
              )}
            </div>
          </div>
        )}

        <div
          ref={
            bottomRef
          }
        />
      </div>

      <style>{`
  .message-enter{
    animation:fadeIn .3s ease;
  }

  @keyframes fadeIn{
    from{
      opacity:0;
      transform:translateY(8px);
    }
    to{
      opacity:1;
      transform:translateY(0);
    }
  }
      `}</style>
    </div>
  );
}