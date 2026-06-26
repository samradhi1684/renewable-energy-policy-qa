"use client";

import {
  useEffect,
  useState
} from "react";

import {
  getSharedChat
} from "@/lib/api";

type Message = {
  id: string;
  role: string;
  content: string;
};

import { use } from "react";

export default function SharedChatPage({
  params
}: {
  params: Promise<{
    shareId: string;
  }>;
}) {
  const { shareId } =
    use(params);
{

  const [messages, setMessages] =
    useState<Message[]>([]);

  useEffect(() => {
    async function load() {
      const data =
        await getSharedChat(
          shareId
        );

      setMessages(
        data.messages
      );
    }

    load();
  }, [shareId]);

  return (
  <div
    style={{
      maxWidth: "850px",
      margin: "40px auto",
      padding: "20px",
      fontFamily: "Arial"
    }}
  >
    <h1
      style={{
        textAlign: "center",
        marginBottom: "40px",
      }}
    >
      Renewable Policy Chat
    </h1>

    {messages.map((msg) => (
      <div
        key={msg.id}
        style={{
          marginBottom: "28px",
        }}
      >
        {msg.role === "user" ? (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                background: "#f3f3f3",
                padding: "14px 18px",
                borderRadius: "18px",
                maxWidth: "70%",
              }}
            >
              {msg.content}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "6px 0",
              lineHeight: 1.7,
              whiteSpace:
                "pre-wrap",
            }}
          >
            {msg.content}
          </div>
        )}
      </div>
    ))}
  </div>
);
}
}