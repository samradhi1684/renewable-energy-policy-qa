"use client";

import { useState, useEffect, useCallback } from "react";

import ChatWindow, { type Message } from "../components/chatWindow";
import InputBar from "../components/inputBar";
import Sidebar from "../components/sideBar";
import EmptyState from "../components/emptyState";

import {
  createChat,
  listChats,
  getChat,
  queryInChat,
  deleteChat,
  renameChat,
  pinChat,
  type Chat,
} from "../lib/api";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState("dsire");

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);

  // Load existing chats from backend on mount
  useEffect(() => {
    listChats().then(setChats).catch(() => {});
  }, []);

  // Rebuild flat Message[] from a chat's history
  function loadChatMessages(chat: Chat) {
    const msgs: Message[] = [];
    for (const m of chat.messages) {
      msgs.push({ role: "user", content: m.question });
      msgs.push({ role: "assistant", content: m.answer, sources: m.sources });
    }
    setActiveMessages(msgs);
  }

  async function handleNewChat() {
    const chat = await createChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.chat_id);
    setActiveMessages([]);
  }

  async function handleSelectChat(id: string) {
    setActiveChatId(id);
    const chat = await getChat(id);
    loadChatMessages(chat);
  }

  async function handleDeleteChat(id: string) {
    await deleteChat(id);
    setChats((prev) => prev.filter((c) => c.chat_id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
      setActiveMessages([]);
    }
  }

  async function handleRenameChat(id: string, newTitle: string) {
    const updated = await renameChat(id, newTitle);
    setChats((prev) =>
      prev.map((c) => (c.chat_id === id ? { ...c, title: updated.title } : c))
    );
  }

  async function handlePinChat(id: string, pinned: boolean) {
    const updated = await pinChat(id, pinned);
    setChats((prev) =>
      prev.map((c) =>
        c.chat_id === id ? { ...c, pinned: updated.pinned } : c
      )
    );
  }

  const handleSend = useCallback(async (overrideQuestion?: string) => {
    const currentQuestion = overrideQuestion ?? question;
    if (!currentQuestion.trim() || loading) return;

    setQuestion("");
    setLoading(true);

    // Create a new chat if none is active
    let chatId = activeChatId;
    if (!chatId) {
      const chat = await createChat();
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.chat_id);
      chatId = chat.chat_id;
    }

    // Optimistically append user message
    setActiveMessages((prev) => [
      ...prev,
      { role: "user", content: currentQuestion },
    ]);

    try {
      const response = await queryInChat(chatId, currentQuestion, selectedModel);

      // Append assistant reply with sources if present
      setActiveMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);

      // Refresh chat title (auto-generated after first message)
      const updated = await getChat(chatId);
      setChats((prev) =>
        prev.map((c) =>
          c.chat_id === chatId ? { ...c, title: updated.title } : c
        )
      );
    } catch {
      setActiveMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [question, loading, activeChatId, selectedModel]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--background)",
          // Shift content right to clear the fixed expand button when sidebar is closed
          paddingLeft: sidebarOpen ? 0 : "40px",
          transition: "padding-left 0.2s",
        }}
      >
        {activeMessages.length === 0 ? (
          /* Empty state fills the space above input */
          <EmptyState
            selectedModel={selectedModel}
            onQuestionClick={(q) => {
              setQuestion(q);
              setTimeout(() => handleSend(q), 0);
            }}
          />
        ) : (
          /* Chat window is scrollable */
          <ChatWindow messages={activeMessages} loading={loading} />
        )}

        {/* Input bar pinned to bottom */}
        <div
          style={{
            padding: "12px 24px 20px",
            background: "var(--background)",
          }}
        >
          <InputBar
            value={question}
            onChange={setQuestion}
            onSend={handleSend}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
