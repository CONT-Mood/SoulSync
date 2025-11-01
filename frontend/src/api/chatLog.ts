// src/api/chatLog.ts
const BASE = import.meta.env.VITE_API_BASE ?? "";

export type ChatPair = { sender: "user" | "bot"; message: string; timestamp: string };

export async function getChatDates(userId: string): Promise<string[]> {
  const res = await fetch(`${BASE}/chat-log/dates?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("failed to load dates");
  return await res.json();
}

export async function getChatsByDate(userId: string, date: string): Promise<{ date: string; messages: ChatPair[] }> {
  const res = await fetch(`${BASE}/chat-log/by-date/${encodeURIComponent(date)}?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("failed to load chats");
  return await res.json();
}

export async function getSummaryByDate(userId: string, date: string): Promise<{ ok: boolean; summary: string }> {
  const res = await fetch(
    `${BASE}/chat-log/summary-by-date?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`
  );
  if (!res.ok) throw new Error("failed to load summary");
  return await res.json();
}

export async function getSummaryToday(userId: string): Promise<{ ok: boolean; date: string; summary: string }> {
  const res = await fetch(`${BASE}/chat-log/summary-today?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("failed to load today summary");
  return await res.json();
}
