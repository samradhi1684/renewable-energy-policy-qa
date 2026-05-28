"use client";

import { useState, useEffect } from "react";

import ChatWindow from "../components/chatWindow";
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
  type Message,
} from "../lib/api";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);

  useEffect(() => {
    listChats().then(setChats).catch(() => {});
  }, []);

  function loadChatMessages(chat: Chat) {
    const msgs: Message[] = [];
    for (const m of chat.messages) {
      msgs.push({ role: "user", content: m.question });
      msgs.push({ role: "assistant", content: m.answer });
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
      prev.map((c) => (c.chat_id === id ? { ...c, pinned: updated.pinned } : c))
    );
  }

  async function handleSend() {
    if (!question.trim() || loading) return;

    let chatId = activeChatId;
    if (!chatId) {
      const chat = await createChat();
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.chat_id);
      chatId = chat.chat_id;
    }

    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    setActiveMessages((prev) => [
      ...prev,
      { role: "user", content: currentQuestion },
    ]);

    try {
      const response = await queryInChat(chatId, currentQuestion);

      setActiveMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer },
      ]);

      const updated = await getChat(chatId);
      setChats((prev) =>
        prev.map((c) =>
          c.chat_id === chatId ? { ...c, title: updated.title } : c
        )
      );
    } catch {
      setActiveMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex h-screen bg-white text-black">
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
      />

      <div
        className={`relative flex flex-1 flex-col transition-all duration-200
          ${!sidebarOpen ? "pl-10" : ""}`}
      >
        {activeMessages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex-1 overflow-y-auto px-8 py-10">
            <ChatWindow messages={activeMessages} />
            {loading && (
              <div className="mx-auto mt-8 max-w-3xl text-zinc-500">
                Thinking...
              </div>
            )}
          </div>
        )}

        <div className="pb-6 px-6">
          <InputBar
            value={question}
            onChange={setQuestion}
            onSend={handleSend}
          />
        </div>
      </div>
    </main>
  );
}
