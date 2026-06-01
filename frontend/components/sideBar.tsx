"use client";

import { useState, useRef, useEffect } from "react";
import type { Chat } from "../lib/api";
import { PanelLeft, Plus, MoreVertical, Pin, Pencil, Trash2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const MODELS = [
  { id: "dsire", label: "USA" },
  { id: "mnre", label: "India" },
];

type Props = {
  chats: Chat[];
  activeChatId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onPinChat: (id: string, pinned: boolean) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
};

type MenuState = { chatId: string; x: number; y: number } | null;

export default function Sidebar({
  chats,
  activeChatId,
  isOpen,
  onToggle,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  selectedModel,
  onModelChange,
}: Props) {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState<MenuState>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [modelOpen, setModelOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const selectedLabel = MODELS.find((m) => m.id === selectedModel)?.label ?? "USA";

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  function openMenu(e: React.MouseEvent, chatId: string) {
    e.stopPropagation();
    e.preventDefault();
    setMenu({ chatId, x: e.clientX, y: e.clientY });
  }

  function startRename(chatId: string) {
    const chat = chats.find((c) => c.id === chatId);
    setRenameValue(chat?.title ?? "");
    setRenamingId(chatId);
    setMenu(null);
  }

  function commitRename(chatId: string) {
    if (renameValue.trim()) onRenameChat(chatId, renameValue.trim());
    setRenamingId(null);
  }

  const pinned = chats.filter((c) => c.pinned);
  const unpinned = chats.filter((c) => !c.pinned);

  return (
    <>
      {/* ── Sidebar panel ── */}
      <aside
        style={{
          width: isOpen ? "260px" : "0px",
          minWidth: isOpen ? "260px" : "0px",
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: isOpen ? "8px" : "0px",
          overflow: "hidden",
          transition: "width 0.2s, min-width 0.2s, padding 0.2s",
        }}
      >
        {/* Inner wrapper keeps content at fixed 260px so it doesn't squish */}
        <div style={{ width: "260px", display: "flex", flexDirection: "column", height: "100%" }}>

 
          {/* Header: Sidebar toggle + Model selector in same line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 6px 10px 6px",
            }}
          >
            {/* Sidebar Toggle */}
            <button
              onClick={onToggle}
              style={{
                padding: "6px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--foreground)",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "var(--sidebar-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "transparent")
              }
            >
              <PanelLeft size={18} />
            </button>

            {/* Model Selector */}
            <div style={{ position: "relative", flex: 1 }}>
              <button
                onClick={() => setModelOpen((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                <span>{selectedLabel}</span>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: modelOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    opacity: 0.5,
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {modelOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid var(--sidebar-border)",
                    borderRadius: "10px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onModelChange(m.id);
                        setModelOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        border: "none",
                        background:
                          selectedModel === m.id
                            ? "var(--sidebar-hover)"
                            : "#fff",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "var(--foreground)",
                      }}
                    >
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* New Chat button */}
          <button
            onClick={onNewChat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              color: "var(--foreground)",
              marginBottom: "8px",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "var(--sidebar-hover)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
            }
          >
            <Plus size={16} />
            <span>New chat</span>
          </button>

          {/* Chat list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {chats.length === 0 ? (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--placeholder-text)",
                  padding: "4px 10px",
                }}
              >
                No chats yet
              </p>
            ) : (
              <>
                {/* Pinned section */}
                {pinned.length > 0 && (
                  <>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--placeholder-text)",
                        padding: "4px 10px 6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Pinned
                    </p>
                    {pinned.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === activeChatId}
                        isRenaming={renamingId === chat.id}
                        renameValue={renameValue}
                        renameRef={renameRef}
                        onSelect={() => onSelectChat(chat.id)}
                        onOpenMenu={(e) => openMenu(e, chat.id)}
                        onRenameChange={setRenameValue}
                        onRenameCommit={() => commitRename(chat.id)}
                      />
                    ))}
                  </>
                )}

                {/* Recent section */}
                {unpinned.length > 0 && (
                  <>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--placeholder-text)",
                        padding: "4px 10px 6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Recent
                    </p>
                    {unpinned.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === activeChatId}
                        isRenaming={renamingId === chat.id}
                        renameValue={renameValue}
                        renameRef={renameRef}
                        onSelect={() => onSelectChat(chat.id)}
                        onOpenMenu={(e) => openMenu(e, chat.id)}
                        onRenameChange={setRenameValue}
                        onRenameCommit={() => commitRename(chat.id)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* User profile at bottom */}
          <div
            style={{
              borderTop: "1px solid var(--sidebar-border)",
              paddingTop: "8px",
              marginTop: "8px",
            }}
          >
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "var(--sidebar-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
              }
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#19c37d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user?.username?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.username ?? "Guest"}
                </span>

                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--placeholder-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.email}
                </span>
              </div>
</button>

<button
  onClick={() => {
    logout();
    window.location.href = "/login";
  }}
  style={{
    width: "100%",
    marginTop: "6px",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid var(--sidebar-border)",
    background: "transparent",
    cursor: "pointer",
    fontSize: "13px",
    color: "#ef4444",
  }}
>
  Logout
</button>

</div>

</div>
</aside>

      {/* Expand button shown when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          title="Open sidebar"
          style={{
            position: "fixed",
            left: "12px",
            top: "12px",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid var(--sidebar-border)",
            background: "var(--sidebar-bg)",
            color: "var(--foreground)",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <PanelLeft size={18} />
        </button>
      )}

      {/* Context menu */}
      {menu && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menu.y,
            left: menu.x,
            zIndex: 100,
            minWidth: "180px",
            borderRadius: "12px",
            border: "1px solid var(--sidebar-border)",
            background: "#fff",
            padding: "4px 0",
            fontSize: "14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
          }}
        >
          {(() => {
            const chat = chats.find((c) => c.id === menu.chatId);
            if (!chat) return null;
            return (
              <>
                <ContextMenuItem
                  icon={<Pin size={15} />}
                  label={chat.pinned ? "Unpin" : "Pin"}
                  onClick={() => {
                    onPinChat(menu.chatId, !chat.pinned);
                    setMenu(null);
                  }}
                />
                <ContextMenuItem
                  icon={<Pencil size={15} />}
                  label="Rename"
                  onClick={() => startRename(menu.chatId)}
                />
                <div
                  style={{
                    margin: "4px 0",
                    borderTop: "1px solid var(--sidebar-border)",
                  }}
                />
                <ContextMenuItem
                  icon={<Trash2 size={15} />}
                  label="Delete"
                  onClick={() => {
                    onDeleteChat(menu.chatId);
                    setMenu(null);
                  }}
                  danger
                />
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}

// ── ChatRow ───────────────────────────────────────────────────────────────────

type ChatRowProps = {
  chat: Chat;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onOpenMenu: (e: React.MouseEvent) => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
};

function ChatRow({
  chat,
  isActive,
  isRenaming,
  renameValue,
  renameRef,
  onSelect,
  onOpenMenu,
  onRenameChange,
  onRenameCommit,
}: ChatRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: "8px",
        marginBottom: "2px",
        background: isActive
          ? "var(--sidebar-active)"
          : hovered
          ? "var(--sidebar-hover)"
          : "transparent",
      }}
    >
      <button
        onClick={onSelect}
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          padding: "8px 10px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") onRenameCommit();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              borderRadius: "6px",
              border: "1px solid var(--sidebar-border)",
              padding: "2px 6px",
              fontSize: "13px",
              outline: "none",
            }}
          />
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              color: "var(--foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {chat.pinned && (
              <Pin size={11} style={{ flexShrink: 0, opacity: 0.5 }} />
            )}
            {chat.title}
          </span>
        )}
      </button>

      {!isRenaming && (hovered || isActive) && (
        <button
          onClick={onOpenMenu}
          title="Options"
          style={{
            marginRight: "6px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--foreground)",
            opacity: 0.6,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(0,0,0,0.07)";
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.6";
          }}
        >
          <MoreVertical size={15} />
        </button>
      )}
    </div>
  );
}

// ── ContextMenuItem ───────────────────────────────────────────────────────────

function ContextMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 14px",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "14px",
        color: danger ? "#ef4444" : "var(--foreground)",
        background: hovered
          ? danger
            ? "#fff1f1"
            : "var(--sidebar-hover)"
          : "transparent",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
