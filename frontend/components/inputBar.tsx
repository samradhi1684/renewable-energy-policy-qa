"use client";

import {
  useRef,
  useEffect,
  useState
} from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
};

const BASE =
  "http://127.0.0.1:8000";

export default function InputBar({
  value,
  onChange,
  onSend,
  loading,
}: Props) {

  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null
    );

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null
    );

  const chunksRef =
    useRef<Blob[]>([]);

  const [
    recording,
    setRecording
  ] = useState(false);

  // Auto-grow textarea
  useEffect(() => {

    const el =
      textareaRef.current;

    if (!el) return;

    el.style.height =
      "auto";

    el.style.height =
      Math.min(
        el.scrollHeight,
        200
      ) + "px";

  }, [value]);

  function handleKeyDown(
    e: React.KeyboardEvent<
      HTMLTextAreaElement
    >
  ) {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      onSend();
    }
  }

  async function toggleRecording() {

    if (recording) {

      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });

      const recorder =
        new MediaRecorder(
          stream
        );

      mediaRecorderRef.current =
        recorder;

      chunksRef.current = [];

      recorder.ondataavailable =
        (e) => {
          chunksRef.current.push(
            e.data
          );
        };

      recorder.onstop =
        async () => {

          const blob =
            new Blob(
              chunksRef.current,
              {
                type:
                  "audio/webm"
              }
            );

          const formData =
            new FormData();

          formData.append(
            "audio",
            blob,
            "audio.webm"
          );

          try {

            const res =
              await fetch(
                `${BASE}/chats/transcribe`,
                {
                  method:
                    "POST",
                  body:
                    formData
                }
              );

            if (
              !res.ok
            ) {
              throw new Error(
                "Transcription failed"
              );
            }

            const data =
              await res.json();

            onChange(
              data.text || ""
            );

          } catch (err) {

            console.error(
              err
            );

            alert(
              "Speech transcription failed"
            );
          }
        };

      recorder.start();
      setRecording(true);

    } catch (err) {

      console.error(
        err
      );

      alert(
        "Microphone access denied"
      );
    }
  }

  const canSend =
    value.trim().length > 0 &&
    !loading;

  return (
  <div
    style={{
      maxWidth: "760px",
      margin: "0 auto",
      width: "100%",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background:
          "var(--input-bg)",
        border:
          "1px solid var(--input-border)",
        borderRadius: "24px",
        padding:
          "10px 12px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.04)",
      }}
    >


      {/* TEXTAREA CENTER */}
      <textarea
        ref={
          textareaRef
        }
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        onKeyDown={
          handleKeyDown
        }
        placeholder="Message the QA System"
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          border: "none",
          outline: "none",
          background:
            "transparent",
          fontSize: 15,
          color:
            "var(--foreground)",
          lineHeight: 1.6,
          maxHeight: 200,
          overflowY: "auto",
          fontFamily:
            "inherit",
        }}
      />

      {/* MIC RIGHT */}
      <button
        onClick={
          toggleRecording
        }
        title={
          recording
            ? "Stop recording"
            : "Voice input"
        }
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          border: "none",
          background:
            recording
              ? "#ef4444"
              : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color:
            recording
              ? "#fff"
              : "#777",
          flexShrink: 0,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line
            x1="12"
            x2="12"
            y1="19"
            y2="22"
          />
        </svg>
      </button>

      {/*SEND RIGHT */}
      <button
        onClick={onSend}
        disabled={!canSend}
        title="Send"
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          border: "none",
         background:
          canSend
            ? "#111827"
            : "#e5e7eb",
          cursor:
            canSend
              ? "pointer"
              : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          flexShrink: 0,
          transition:
            "all 0.15s",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      </button>

    </div>
  </div>
);
}