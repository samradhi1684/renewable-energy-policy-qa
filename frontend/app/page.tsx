"use client";

import { useState, useEffect, useCallback } from "react";

import ChatWindow, { type Message } from "../components/chatWindow";
import InputBar from "../components/inputBar";
import Sidebar from "../components/sideBar";
import EmptyState from "../components/emptyState";
import SourcePane from "../components/sourcePane";

import {
  createChat,
  listChats,
  getChat,
  getMessages,
  queryInChat,
  regenerateAnswer,
  deleteChat,
  renameChat,
  pinChat,
  type Chat,
  type Source,
} from "../lib/api";

export default function Home() {

  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [selectedModel, setSelectedModel] =
    useState("dsire");

  const [chats, setChats] =
    useState<Chat[]>([]);

  const [activeChatId, setActiveChatId] =
    useState<string | null>(null);

  const [activeMessages, setActiveMessages] =
    useState<Message[]>([]);

  const [
    sourcePaneSources,
    setSourcePaneSources
  ] = useState<Source[] | null>(
    null
  );

  const [
    sourcePaneIndex,
    setSourcePaneIndex
  ] = useState(0);

  useEffect(() => {
    listChats()
      .then(setChats)
      .catch(() => {});
  }, []);



  async function handleNewChat() {
    const chat = await createChat();

    setChats((prev) => [
      chat,
      ...prev,
    ]);

    setActiveChatId(chat.id);

    setActiveMessages([]);
    setSourcePaneSources(null);
  }


  async function handleSelectChat(id: string) {
    setActiveChatId(id);
    setSourcePaneSources(null);

    const messages = await getMessages(id);

    const formatted: Message[] = [];

    for (const m of messages) {
      formatted.push({
        role: m.role,
        content: m.content,
      });
    }

    setActiveMessages(formatted);
  }

  async function handleDeleteChat(
    id: string
  ) {

    await deleteChat(id);

    setChats((prev) =>
      prev.filter(
        (c) =>
          c.id !== id
      )
    );

    if (
      activeChatId === id
    ) {
      setActiveChatId(null);
      setActiveMessages([]);
      setSourcePaneSources(
        null
      );
    }
  }

  async function handleRenameChat(
    id: string,
    newTitle: string
  ) {

    const updated =
      await renameChat(
        id,
        newTitle
      );

    setChats((prev) =>
      prev.map((c) =>

        c.id === id
          ? {
              ...c,
              title: updated.title,
            }
          : c
      )
    );
  }

  async function handlePinChat(
    id: string,
    pinned: boolean
  ) {

    const updated =
      await pinChat(
        id,
        pinned
      );

  setChats((prev) =>
    prev.map((c) =>
      c.id === id
        ? {
            ...c,
            pinned: updated.pinned,
          }
        : c
    )
  );
  }

  function handleSourceClick(
    sources: Source[],
    index: number
  ) {
    if (
      sourcePaneSources === sources &&
      sourcePaneIndex === index
    ) {
      setSourcePaneSources(null);
      return;
    }

    setSourcePaneSources(
      sources
    );

    setSourcePaneIndex(
      index
    );
  }

  async function handleRegenerate(
    index: number
  ) {

    if (!activeChatId)
      return;

    const assistant =
      activeMessages[index];

    const user =
      activeMessages[
        index - 1
      ];

    if (
      !assistant ||
      !user ||
      assistant.role !==
        "assistant" ||
      user.role !==
        "user"
    ) {
      return;
    }

    setLoading(true);
    // remove old assistant answer
    setActiveMessages(
      (prev) => {

        const next =
          [...prev];

        next[index] = {
          role:
            "assistant",
          content:
            "__loading__",
          sources: [],
        };

        return next;
      }
    );
    try {

      const response =
        await regenerateAnswer(
          activeChatId,
          user.content,
          assistant.sources || []
        );

      setActiveMessages(
        (prev) => {
          const next = [...prev];

          next[index] = {
            role: "assistant",
            content: response.answer,
            sources: response.sources,
          };

          return next;
        }
      );

    } finally {
      setLoading(false);
    }
  }

  const handleSend =
    useCallback(
      async (
        overrideQuestion?: string
      ) => {

        const currentQuestion =
          overrideQuestion ??
          question;

        if (
          !currentQuestion.trim() ||
          loading
        )
          return;

        setQuestion("");
        setLoading(true);
        setSourcePaneSources(
          null
        );

        let chatId =
          activeChatId;

        if (!chatId) {

          const chat =
            await createChat();

          setChats(
            (prev) => [
              chat,
              ...prev,
            ]
          );

          setActiveChatId(
            chat.id
          );

          chatId =
            chat.id;
        }

        setActiveMessages(
          (prev) => [
            ...prev,
            {
              role:
                "user",
              content:
                currentQuestion,
            },
          ]
        );

        try {

          const response =
            await queryInChat(
              chatId,
              currentQuestion
            );

          setActiveMessages(
            (prev) => [
              ...prev,
              {
                role:
                  "assistant",
                content:
                  response.answer,
                sources:
                  response.sources,
              },
            ]
          );

        } catch {

          setActiveMessages(
            (prev) => [
              ...prev,
              {
                role:
                  "assistant",
                content:
                  "Sorry, something went wrong.",
              },
            ]
          );

        } finally {
          setLoading(false);
        }
      },
      [
        question,
        loading,
        activeChatId,
      ]
    );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background:
          "var(--background)",
        overflow:
          "hidden",
      }}
    >
      <Sidebar
        chats={chats}
        activeChatId={
          activeChatId
        }
        isOpen={
          sidebarOpen
        }
        onToggle={() =>
          setSidebarOpen(
            (v) => !v
          )
        }
        onNewChat={
          handleNewChat
        }
        onSelectChat={
          handleSelectChat
        }
        onDeleteChat={
          handleDeleteChat
        }
        onRenameChat={
          handleRenameChat
        }
        onPinChat={
          handlePinChat
        }
        selectedModel={
          selectedModel
        }
        onModelChange={
          setSelectedModel
        }
      />

      <div
        style={{
          flex: 1,
          display:
            "flex",
          flexDirection:
            "column",
          overflow:
            "hidden",
          minWidth: 0,
        }}
      >
        {activeMessages.length ===
        0 ? (
          <EmptyState
            selectedModel={
              selectedModel
            }
            onQuestionClick={(
              q
            ) => {
              setQuestion(q);

              setTimeout(
                () =>
                  handleSend(
                    q
                  ),
                0
              );
            }}
          />
        ) : (
          <ChatWindow
            messages={
              activeMessages
            }
            loading={
              loading
            }
            onSourceClick={
              handleSourceClick
            }
            onRegenerate={
              handleRegenerate
            }
          />
        )}

        <div
          style={{
            padding:
              "12px 24px 20px",
            background:
              "var(--background)",
          }}
        >
          <InputBar
            value={
              question
            }
            onChange={
              setQuestion
            }
            onSend={
              handleSend
            }
            loading={
              loading
            }
          />
        </div>
      </div>

      {sourcePaneSources &&
        sourcePaneSources.length >
          0 && (
          <SourcePane
            sources={
              sourcePaneSources
            }
            activeIndex={
              sourcePaneIndex
            }
            onSelectSource={
              setSourcePaneIndex
            }
            onClose={() =>
              setSourcePaneSources(
                null
              )
            }
          />
        )}
    </div>
  );
}