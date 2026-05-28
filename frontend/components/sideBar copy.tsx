// "use client";

// import { useState, useRef, useEffect } from "react";
// import type { Chat } from "../lib/api";

// type Props = {
//   chats: Chat[];
//   activeChatId: string | null;
//   isOpen: boolean;
//   onToggle: () => void;
//   onNewChat: () => void;
//   onSelectChat: (id: string) => void;
//   onDeleteChat: (id: string) => void;
//   onRenameChat: (id: string, newTitle: string) => void;
//   onPinChat: (id: string, pinned: boolean) => void;
// };

// type MenuState = { chatId: string; x: number; y: number } | null;

// export default function Sidebar({
//   chats,
//   activeChatId,
//   isOpen,
//   onToggle,
//   onNewChat,
//   onSelectChat,
//   onDeleteChat,
//   onRenameChat,
//   onPinChat,
// }: Props) {
//   const [menu, setMenu] = useState<MenuState>(null);
//   const [renamingId, setRenamingId] = useState<string | null>(null);
//   const [renameValue, setRenameValue] = useState("");
//   const menuRef = useRef<HTMLDivElement>(null);
//   const renameRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     function handle(e: MouseEvent) {
//       if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
//         setMenu(null);
//       }
//     }
//     document.addEventListener("mousedown", handle);
//     return () => document.removeEventListener("mousedown", handle);
//   }, []);

//   useEffect(() => {
//     if (renamingId) renameRef.current?.focus();
//   }, [renamingId]);

//   function openMenu(e: React.MouseEvent, chatId: string) {
//     e.stopPropagation();
//     e.preventDefault();
//     setMenu({ chatId, x: e.clientX, y: e.clientY });
//   }

//   function startRename(chatId: string) {
//     const chat = chats.find((c) => c.chat_id === chatId);
//     setRenameValue(chat?.title ?? "");
//     setRenamingId(chatId);
//     setMenu(null);
//   }

//   function commitRename(chatId: string) {
//     if (renameValue.trim()) onRenameChat(chatId, renameValue.trim());
//     setRenamingId(null);
//   }

//   const pinned = chats.filter((c) => c.pinned);
//   const unpinned = chats.filter((c) => !c.pinned);

//   return (
//     <>
//       {/* ── Sidebar panel ── */}
//       <aside
//         style={{ width: isOpen ? 240 : 0 }}
//         className="relative flex-shrink-0 flex flex-col bg-black border-r border-zinc-900
//           overflow-hidden transition-[width] duration-200"
//       >
//         {/* Inner wrapper keeps content at fixed 240px so it doesn't squish */}
//         <div className="flex flex-col h-full" style={{ width: 240 }}>

//           {/* Header */}
//           <div className="flex items-center gap-2 p-3 border-b border-zinc-900">
//             {/* Collapse button */}
//             <button
//               onClick={onToggle}
//               title="Close sidebar"
//               className="flex-shrink-0 flex items-center justify-center w-8 h-8
//                 rounded-lg border border-zinc-800 text-zinc-400
//                 hover:bg-zinc-900 hover:text-white transition"
//             >
//               ‹
//             </button>

//             {/* New Chat */}
//             <button
//               onClick={onNewChat}
//               className="flex-1 rounded-xl border border-zinc-800 px-3 py-2
//                 text-left text-sm hover:bg-zinc-900 transition"
//             >
//               + New Chat
//             </button>
//           </div>

//           {/* Chat list */}
//           <div className="flex-1 overflow-y-auto p-2 space-y-4">
//             {chats.length === 0 && (
//               <p className="text-sm text-zinc-500 px-2 mt-4">No chats yet</p>
//             )}

//             {/* Pinned section */}
//             {pinned.length > 0 && (
//               <div>
//                 <p className="px-2 mb-1 text-[10px] uppercase tracking-widest text-zinc-600">
//                   Pinned
//                 </p>
//                 {pinned.map((chat) => (
//                   <ChatRow
//                     key={chat.chat_id}
//                     chat={chat}
//                     isActive={chat.chat_id === activeChatId}
//                     isRenaming={renamingId === chat.chat_id}
//                     renameValue={renameValue}
//                     renameRef={renameRef}
//                     onSelect={() => onSelectChat(chat.chat_id)}
//                     onOpenMenu={(e) => openMenu(e, chat.chat_id)}
//                     onRenameChange={setRenameValue}
//                     onRenameCommit={() => commitRename(chat.chat_id)}
//                   />
//                 ))}
//               </div>
//             )}

//             {/* Recent section */}
//             {unpinned.length > 0 && (
//               <div>
//                 {pinned.length > 0 && (
//                   <p className="px-2 mb-1 text-[10px] uppercase tracking-widest text-zinc-600">
//                     Recent
//                   </p>
//                 )}
//                 {unpinned.map((chat) => (
//                   <ChatRow
//                     key={chat.chat_id}
//                     chat={chat}
//                     isActive={chat.chat_id === activeChatId}
//                     isRenaming={renamingId === chat.chat_id}
//                     renameValue={renameValue}
//                     renameRef={renameRef}
//                     onSelect={() => onSelectChat(chat.chat_id)}
//                     onOpenMenu={(e) => openMenu(e, chat.chat_id)}
//                     onRenameChange={setRenameValue}
//                     onRenameCommit={() => commitRename(chat.chat_id)}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </aside>

//       {/* ── Expand button shown when sidebar is closed ── */}
//       {!isOpen && (
//         <button
//           onClick={onToggle}
//           title="Open sidebar"
//           className="fixed left-0 top-3 z-50 flex items-center justify-center
//             w-8 h-8 ml-1 rounded-lg border border-zinc-800 bg-black
//             text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
//         >
//           ›
//         </button>
//       )}

//       {/* ── Context menu ── */}
//       {menu && (
//         <div
//           ref={menuRef}
//           style={{ top: menu.y, left: menu.x }}
//           className="fixed z-[100] min-w-[160px] rounded-xl border border-zinc-800
//             bg-zinc-950 shadow-2xl py-1 text-sm"
//         >
//           {(() => {
//             const chat = chats.find((c) => c.chat_id === menu.chatId);
//             if (!chat) return null;
//             return (
//               <>
//                 <button
//                   onClick={() => { onPinChat(menu.chatId, !chat.pinned); setMenu(null); }}
//                   className="w-full flex items-center gap-3 px-4 py-2.5
//                     text-zinc-300 hover:bg-zinc-800 transition text-left"
//                 >
//                   <span>📌</span>
//                   {chat.pinned ? "Unpin" : "Pin"}
//                 </button>
//                 <button
//                   onClick={() => startRename(menu.chatId)}
//                   className="w-full flex items-center gap-3 px-4 py-2.5
//                     text-zinc-300 hover:bg-zinc-800 transition text-left"
//                 >
//                   <span>✏️</span>
//                   Rename
//                 </button>
//                 <div className="my-1 border-t border-zinc-800" />
//                 <button
//                   onClick={() => { onDeleteChat(menu.chatId); setMenu(null); }}
//                   className="w-full flex items-center gap-3 px-4 py-2.5
//                     text-red-400 hover:bg-red-950/50 transition text-left"
//                 >
//                   <span>🗑️</span>
//                   Delete
//                 </button>
//               </>
//             );
//           })()}
//         </div>
//       )}
//     </>
//   );
// }

// // ── ChatRow ───────────────────────────────────────────────────────────────────

// type ChatRowProps = {
//   chat: Chat;
//   isActive: boolean;
//   isRenaming: boolean;
//   renameValue: string;
//   renameRef: React.RefObject<HTMLInputElement | null>;
//   onSelect: () => void;
//   onOpenMenu: (e: React.MouseEvent) => void;
//   onRenameChange: (v: string) => void;
//   onRenameCommit: () => void;
// };

// function ChatRow({
//   chat,
//   isActive,
//   isRenaming,
//   renameValue,
//   renameRef,
//   onSelect,
//   onOpenMenu,
//   onRenameChange,
//   onRenameCommit,
// }: ChatRowProps) {
//   return (
//     <div
//       className={`flex items-center rounded-xl mb-0.5 transition-colors
//         ${isActive ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
//     >
//       {/* Clickable title area */}
//       <button
//         onClick={onSelect}
//         className="flex-1 min-w-0 px-3 py-2.5 text-left"
//       >
//         {isRenaming ? (
//           <input
//             ref={renameRef}
//             value={renameValue}
//             onChange={(e) => onRenameChange(e.target.value)}
//             onBlur={onRenameCommit}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" || e.key === "Escape") onRenameCommit();
//               e.stopPropagation();
//             }}
//             onClick={(e) => e.stopPropagation()}
//             className="w-full bg-zinc-700 text-white text-sm rounded-lg
//               px-2 py-1 outline-none border border-zinc-600 focus:border-zinc-400"
//           />
//         ) : (
//           <>
//             <span
//               className={`flex items-center gap-1 text-sm truncate
//                 ${isActive ? "text-white" : "text-zinc-400"}`}
//             >
//               {chat.pinned && <span className="text-[10px]">📌</span>}
//               {chat.title}
//             </span>
//             <span className="block text-[11px] text-zinc-600 mt-0.5">
//               {new Date(chat.created_at).toLocaleDateString(undefined, {
//                 month: "short",
//                 day: "numeric",
//               })}
//             </span>
//           </>
//         )}
//       </button>

//       {/* ⋯ button — always visible, not hover-dependent */}
//       {!isRenaming && (
//         <button
//           onClick={onOpenMenu}
//           title="Options"
//           className="flex-shrink-0 mr-2 flex items-center justify-center
//             w-7 h-7 rounded-lg text-zinc-500 hover:text-white
//             hover:bg-zinc-700 transition text-base leading-none"
//         >
//           ···
//         </button>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useRef, useEffect } from "react";
import type { Chat } from "../lib/api";

import {
  PanelLeft,
  Plus,
  MoreVertical,
  Pin,
  Pencil,
  Trash2,
} from "lucide-react";

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
}: Props) {
  const [menu, setMenu] = useState<MenuState>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

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
    setMenu({
      chatId,
      x: e.clientX,
      y: e.clientY,
    });
  }

  function startRename(chatId: string) {
    const chat = chats.find((c) => c.chat_id === chatId);

    setRenameValue(chat?.title ?? "");
    setRenamingId(chatId);
    setMenu(null);
  }

  function commitRename(chatId: string) {
    if (renameValue.trim()) {
      onRenameChat(chatId, renameValue.trim());
    }

    setRenamingId(null);
  }

  const pinned = chats.filter((c) => c.pinned);
  const unpinned = chats.filter((c) => !c.pinned);

  return (
    <>
      <aside
        style={{ width: isOpen ? 280 : 0 }}
        className="
          relative
          flex-shrink-0
          overflow-hidden
          border-r
          border-gray-200
          bg-[#f7f7f5]
          transition-[width]
          duration-200
        "
      >
        <div
          className="flex h-full flex-col"
          style={{ width: 280 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4">
            <h1 className="text-2xl font-serif font-medium text-black">
              PolicyLens
            </h1>

            <button
              onClick={onToggle}
              className="
                rounded-lg
                p-2
                text-gray-600
                hover:bg-gray-200
                transition
              "
            >
              <PanelLeft size={18} />
            </button>
          </div>

          {/* New Chat */}
          <div className="px-3 pb-3">
            <button
              onClick={onNewChat}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-sm
                text-gray-800
                hover:bg-gray-200
                transition
              "
            >
              <Plus size={18} />
              New chat
            </button>
          </div>

          {/* Recents */}
          <div className="px-4 pb-2">
            <p className="text-sm font-medium text-gray-500">
              Recents
            </p>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {chats.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">
                No chats yet
              </p>
            )}

            {pinned.length > 0 && (
              <div className="mb-3">
                <p className="px-3 py-1 text-xs uppercase tracking-wider text-gray-400">
                  Pinned
                </p>

                {pinned.map((chat) => (
                  <ChatRow
                    key={chat.chat_id}
                    chat={chat}
                    isActive={chat.chat_id === activeChatId}
                    isRenaming={renamingId === chat.chat_id}
                    renameValue={renameValue}
                    renameRef={renameRef}
                    onSelect={() => onSelectChat(chat.chat_id)}
                    onOpenMenu={(e) => openMenu(e, chat.chat_id)}
                    onRenameChange={setRenameValue}
                    onRenameCommit={() =>
                      commitRename(chat.chat_id)
                    }
                  />
                ))}
              </div>
            )}

            {unpinned.length > 0 && (
              <div>
                {unpinned.map((chat) => (
                  <ChatRow
                    key={chat.chat_id}
                    chat={chat}
                    isActive={chat.chat_id === activeChatId}
                    isRenaming={renamingId === chat.chat_id}
                    renameValue={renameValue}
                    renameRef={renameRef}
                    onSelect={() => onSelectChat(chat.chat_id)}
                    onOpenMenu={(e) => openMenu(e, chat.chat_id)}
                    onRenameChange={setRenameValue}
                    onRenameCommit={() =>
                      commitRename(chat.chat_id)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {!isOpen && (
        <button
          onClick={onToggle}
          title="Open sidebar"
          className="
            fixed
            left-3
            top-3
            z-50
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-gray-200
            bg-white
            text-gray-700
            shadow-sm
            hover:bg-gray-100
          "
        >
          <PanelLeft size={18} />
        </button>
      )}

      {/* Context Menu */}
      {menu && (
        <div
          ref={menuRef}
          style={{
            top: menu.y,
            left: menu.x,
          }}
          className="
            fixed
            z-[100]
            min-w-[180px]
            rounded-2xl
            border
            border-gray-200
            bg-white
            py-2
            text-sm
            shadow-xl
          "
        >
          {(() => {
            const chat = chats.find(
              (c) => c.chat_id === menu.chatId
            );

            if (!chat) return null;

            return (
              <>
                <button
                  onClick={() => {
                    onPinChat(
                      menu.chatId,
                      !chat.pinned
                    );
                    setMenu(null);
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-2.5
                    text-left
                    text-gray-700
                    hover:bg-gray-100
                  "
                >
                  <Pin size={16} />
                  {chat.pinned ? "Unpin" : "Pin"}
                </button>

                <button
                  onClick={() =>
                    startRename(menu.chatId)
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-2.5
                    text-left
                    text-gray-700
                    hover:bg-gray-100
                  "
                >
                  <Pencil size={16} />
                  Rename
                </button>

                <div className="my-1 border-t border-gray-200" />

                <button
                  onClick={() => {
                    onDeleteChat(menu.chatId);
                    setMenu(null);
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-2.5
                    text-left
                    text-red-500
                    hover:bg-red-50
                  "
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}

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
  return (
    <div
      className={`
        group
        flex
        items-center
        rounded-lg
        transition
        ${
          isActive
            ? "bg-gray-200"
            : "hover:bg-gray-100"
        }
      `}
    >
      <button
        onClick={onSelect}
        className="
          flex-1
          min-w-0
          px-3
          py-2.5
          text-left
        "
      >
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) =>
              onRenameChange(e.target.value)
            }
            onBlur={onRenameCommit}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === "Escape"
              ) {
                onRenameCommit();
              }

              e.stopPropagation();
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
            className="
              w-full
              rounded-md
              border
              border-gray-300
              bg-white
              px-2
              py-1
              text-sm
              outline-none
            "
          />
        ) : (
          <span className="flex items-center gap-2 truncate text-sm text-gray-800">
            {chat.pinned && <Pin size={12} />}
            {chat.title}
          </span>
        )}
      </button>

      {!isRenaming && (
        <button
          onClick={onOpenMenu}
          title="Options"
          className="
            mr-2
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-md
            text-gray-500
            opacity-0
            transition
            group-hover:opacity-100
            hover:bg-gray-200
          "
        >
          <MoreVertical size={16} />
        </button>
      )}
    </div>
  );
}