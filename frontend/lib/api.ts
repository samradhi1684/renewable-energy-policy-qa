const BASE = "http://127.0.0.1:8000";

export type Source = {
  chunk_id: string;
  document_id: string;
  score: number;
  chunk_text: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type ChatMessage = {
  question: string;
  answer: string;
  sources: Source[];
};

export type Chat = {
  id: string;
  title: string;
  created_at: string;
  user_id?: string;
  pinned: boolean
};

export async function askQuestion(question: string) {
  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Failed to fetch answer");
  return res.json();
}

export async function createChat(): Promise<Chat> {
  const token =
    localStorage.getItem("token");

  const res = await fetch(
    `${BASE}/chats`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(
      "Failed to create chat"
    );
  }

  return res.json();
}

export async function listChats(): Promise<Chat[]> {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${BASE}/chats`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to list chats");
  }

  return res.json();
}

export async function getChat(chatId: string): Promise<Chat> {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${BASE}/chats/${chatId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to get chat");

  return res.json();
}

export async function queryInChat(
  chatId: string,
  question: string
): Promise<{ answer: string; sources: Source[] }> {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${BASE}/chats/${chatId}/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question }),
    }
  );
  if (!res.ok) throw new Error("Failed to query");
  return res.json();
}

export async function deleteChat(chatId: string): Promise<void> {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${BASE}/chats/${chatId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to delete chat");
}

export async function renameChat(chatId: string, title: string): Promise<Chat> {
  const res = await fetch(`${BASE}/chats/${chatId}/rename`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,
 },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to rename chat");
  return res.json();
}

export async function pinChat(
  chatId: string,
  pinned: boolean
): Promise<Chat> {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${BASE}/chats/${chatId}/pin`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pinned }),
    }
  );

  if (!res.ok) throw new Error("Failed to pin chat");

  return res.json();
}