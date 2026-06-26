"use client";

import {
  useRef,
  useEffect,
  useState
} from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: (question?: string) => void;
  loading?: boolean;
  selectedFile: File | null;
  onFileSelect: (
    file: File | null
  ) => void;
  webSearch: boolean;
  onWebSearchChange: (
    value: boolean
  ) => void;
};

const BASE =
  "http://127.0.0.1:8000";

export default function InputBar({
  value,
  onChange,
  onSend,
  loading,
  selectedFile,
  onFileSelect,
  webSearch,
  onWebSearchChange,
}: Props) {

  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null
    );

  const fileInputRef =
    useRef<HTMLInputElement>(
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
  maxWidth: "860px",
  margin: "0 auto",
  width: "100%",
  paddingBottom: "6px",
}}
  >
<div
  style={{
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
    paddingLeft: "12px",
  }}
>
  <label
    style={{
      fontSize: "12px",
      color: "#64748B",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: 500,
    }}
  >
    <input
      type="checkbox"
      checked={webSearch}
      onChange={(e) =>
        onWebSearchChange(
          e.target.checked
        )
      }
      style={{
        width: "13px",
        height: "13px",
        cursor: "pointer",
      }}
    />
    Search Web
  </label>
</div>
<div
      style={{
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "#FFFFFF",
  border: "1px solid #E7EAF3",
  borderRadius: "32px",
  padding: "10px 14px",
  minHeight: "60px",
  boxShadow:
    "0 4px 18px rgba(15,23,42,0.05)",
}}
    >



<input
  ref={fileInputRef}
  type="file"
  accept=".pdf,.md,.txt"
  style={{ display: "none" }}
  onChange={(e) => {
    const file =
      e.target.files?.[0];

    if (file) {
      console.log(
        "Selected file:",
        file.name
      );

      onFileSelect(file);
    }
  }}
/>

      <button
        type="button"
        onClick={() =>
          fileInputRef.current?.click()
        }
        title="Attach document"
        style={{
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  border: "none",
  background: "#EEF2FF",
color: "#4F46E5",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
 
  fontSize: "22px",
  fontWeight: 300,
  flexShrink: 0,
}}
      >
        +
      </button>

      {selectedFile && (
        <div
          style={{
  fontSize: "12px",
  background: "#EEF2FF",
  color: "#4F46E5",
  padding: "4px 10px",
  borderRadius: "14px",
  whiteSpace: "nowrap",
}}
        >
          📄 {selectedFile.name}
        </div>
      )}



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
        placeholder="Ask about renewable energy policies, incentives, regulations..."
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          border: "none",
          outline: "none",
          background:
            "transparent",
          fontSize: "14px",
fontWeight: 400,
color: "#0F172A",
lineHeight: 1.5,
         
        
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
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: "none",
          background:
            recording
              ? "#EF4444"
              : "#F8FAFC",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color:
            recording
              ? "#fff"
              : "#64748B",
         
   
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
        onClick={() => onSend()}
        disabled={!canSend}
        title="Send"
    style={{
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  border: "none",
  background:
    canSend
      ? "linear-gradient(135deg,#6366F1,#4F46E5)"
      : "#E5E7EB",
  cursor:
    canSend
      ? "pointer"
      : "not-allowed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  flexShrink: 0,
  boxShadow:
    canSend
      ? "0 4px 12px rgba(99,102,241,0.25)"
      : "none",
  transition:
    "all 0.2s ease",
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