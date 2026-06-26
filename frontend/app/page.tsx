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
  shareChat,
  editMessage,
  type Chat,
  type Source,
} from "../lib/api";


export default function Home() {

  const [question, setQuestion] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

    useEffect(() => {
      console.log(
        "selectedFile:",
        selectedFile
      );
    }, [selectedFile]);

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

  const [editingMessageId, setEditingMessageId] =
  useState<string | null>(null);

  const [editingText, setEditingText] =
  useState("");

  const [webSearch, setWebSearch] =
  useState(false);

  useEffect(() => {
  console.log(
    "webSearch state:",
    webSearch
  );
}, [webSearch]);

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
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
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

  async function handleShareChat(
    chatId: string
  ) {
    try {
      const response =
        await shareChat(
          chatId
        );

      const shareUrl =
        `${window.location.origin}/share/${response.share_id}`;

      await navigator.clipboard.writeText(
        shareUrl
      );

      alert(
        "Share link copied!"
      );

    } catch (err) {
      console.error(err);

      alert(
        "Failed to share chat"
      );
    }
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

      // setActiveMessages(
      //   (prev) => {
      //     const next = [...prev];

      //     next[index] = {
      //       id: crypto.randomUUID(),
      //       role: "assistant",
      //       content: response.answer,
      //       sources: response.sources,
      //       created_at:
      //         new Date().toISOString(),
      //     };

      //     return next;
      //   }
      // );
      setActiveMessages(
        (prev) => {

          const updated =
            [...prev];

          updated[index] = {
            id:
              response.assistant_message_id,

            role:
              "assistant",

            content:
              response.answer,

            sources:
              response.sources || [],

            created_at:
              new Date().toISOString(),
          };

          return updated;
        }
      );

    } finally {
      setLoading(false);
    }
  }
  // function handleStartEdit(
  //   index: number
  // ) {
  //   const msg =
  //     activeMessages[index];

  //   if (
  //     msg.role !== "user"
  //   )
  //     return;

  //   setEditingMessageId(
  //     msg.id || null
  //   );

  //   setEditingText(
  //     msg.content
  //   );
  // }
  function handleStartEdit(
    index: number
  ) {
    const msg =
      activeMessages[index];

    console.log(
      "START EDIT"
    );

    console.log(
      "CLICKED MESSAGE:",
      msg
    );

    console.log(
      "MESSAGE ID:",
      msg.id
    );

    if (
      msg.role !== "user"
    )
      return;

    setEditingMessageId(
      msg.id || null
    );

    setEditingText(
      msg.content
    );
  }
  async function handleSaveEdit() {

    if (
      !activeChatId ||
      !editingMessageId
    )
      return;

    setLoading(true);

    // find edited message index
    const editIndex =
      activeMessages.findIndex(
        (m) =>
          m.id ===
          editingMessageId
      );

    // keep messages before edited one
    const keptMessages =
      activeMessages.slice(
        0,
        editIndex
      );

    // edited user message
    const tempUser: Message = {
      id: editingMessageId,
      role: "user",
      content: editingText,
      created_at:
        new Date().toISOString(),
    };

    // loading placeholder
    const loadingAssistant: Message = {
      role: "assistant",
      content: "__loading__",
      sources: [],
    };

    // IMMEDIATELY update UI
    setActiveMessages([
      ...keptMessages,
      tempUser,
      loadingAssistant,
    ]);

    try {

      // NOW call backend
      const response =
        await editMessage(
          activeChatId,
          editingMessageId,
          editingText
        );

      const newAssistant: Message = {
        id:
          response.assistant_message_id,

        role:
          "assistant",

        content:
          response.answer,

        sources:
          response.sources || [],

        created_at:
          new Date().toISOString(),
      };

      // replace loading with real answer
      setActiveMessages([
        ...keptMessages,
        tempUser,
        newAssistant,
      ]);

      setEditingMessageId(
        null
      );

      setEditingText("");

    } finally {

      setLoading(false);

    }
  }
  const handleSend =
    useCallback(
      async (
          overrideQuestion?: any
      ) => {
        console.log(
          "overrideQuestion =",
          overrideQuestion
        );
      const currentQuestion =
        typeof overrideQuestion ===
        "string"
          ? overrideQuestion
          : question;

        console.log(
          "currentQuestion:",
          currentQuestion
        );

        console.log(
          "type:",
          typeof currentQuestion
        );

        if (
          currentQuestion.trim() === "" ||
          loading
        ) {
          return;
        }
          

        setQuestion("");
        setSelectedFile(null);
        setLoading(true);
        setSourcePaneSources(
          null
        );

        setActiveMessages(
          (prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "user",
              content: currentQuestion,
              created_at:
                new Date().toISOString(),
            },
          ]
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


        try {

          console.log(
            "QUESTION SENT:",
            currentQuestion
          );

          console.log(
            "WEB SEARCH:",
            webSearch
          );

          const response =
            await queryInChat(
              chatId,
              currentQuestion,
              selectedFile || undefined,
              webSearch
            );

          // const combinedSources: Source[] = [
          //   ...(response.sources || []),

          //   ...((response.web_sources || []).map(
          //     (w: any, idx: number) => ({
          //       chunk_id: `web-${idx}`,
          //       document_id: w.title,
          //       chunk_text: w.content,

          //       token_start: 0,
          //       token_end: 0,

          //       evidence: w.url,
          //       score: 1,

          //       highlight_spans: [],

          //       is_web: true,
          //     } as Source))
          //   ),
          // ];

        

    
          setActiveMessages(
            (prev) => {

              const updated =
                [...prev];

              // replace temp user id with real db id
              updated[
                updated.length - 1
              ] = {
                ...updated[
                  updated.length - 1
                ],
                id:
                  response.user_message_id,
              };

              // add assistant with real db id
              updated.push({
                id:
                  response.assistant_message_id,
                role: "assistant",
                content:
                  response.answer,
                sources:
                  response.sources || [],
                created_at:
                  new Date().toISOString(),
              });

              return updated;
            }
          );

        } catch {

          setActiveMessages(
            (prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role:
                  "assistant",
                content:
                  "Sorry, something went wrong.",
                created_at:
                    new Date().toISOString(),
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
        webSearch,
      ]
    );

  return (
   
      // style={{
      //   display: "flex",
      //   height: "100vh",
      //   background:
      //     "var(--background)",
      //   overflow:
      //     "hidden",
      // }}
  
  <div
    style={{
      display: "flex",
      height: "100vh",
      background: "#f6f7fb",
      padding: "14px",
      gap: "14px",
      overflow: "hidden",
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
        onShareChat={handleShareChat}
        selectedModel={
          selectedModel
        }
        onModelChange={
          setSelectedModel
        }
      />

      <div
        // style={{
        //   flex: 1,
        //   display:
        //     "flex",
        //   flexDirection:
        //     "column",
        //   overflow:
        //     "hidden",
        //   minWidth: 0,
        // }}
       
        // style={{
        //   flex: 1,
        //   background: "#ffffff",
        //   borderRadius: "28px",
        //   border: "1px solid #e5e7eb",
        //   position: "relative",
        //   overflow: "hidden",
        //   display: "flex",
        //   flexDirection: "column",
        // }}
          
        style={{
          flex: 1,
          background: "#ffffff",
          borderRadius: "30px",
          border: "1px solid #ececec",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
        }}


      >
        {activeMessages.length ===
        0 ? (
          <EmptyState
            selectedModel={
              selectedModel
            }
            onQuestionClick={(
              q: string
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
            onEditMessage={
              handleStartEdit
            }

            editingMessageId={
              editingMessageId
            }

            editingText={
              editingText
            }

            onEditTextChange={
              setEditingText
            }

            onSaveEdit={
              handleSaveEdit
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
            value={question}
            onChange={setQuestion}
            onSend={handleSend}
            loading={loading}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            webSearch={webSearch}
            onWebSearchChange={(value) => {
              console.log(
                "checkbox changed:",
                value
              );

              setWebSearch(value);
            }}
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