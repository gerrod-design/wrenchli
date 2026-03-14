import type { Msg } from "./types";

export interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: number;
  pinned?: boolean;
}

const STORAGE_KEY = "wrenchli-conversations";
const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES_PER_CONV = 100;

function generateId(): string {
  return crypto.randomUUID();
}

function generateTitle(messages: Msg[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  const text = first.content.slice(0, 40);
  return text.length < first.content.length ? text + "…" : text;
}

function loadConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Conversation[];
  } catch {}
  return [];
}

function saveConversations(convos: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos.slice(0, MAX_CONVERSATIONS)));
  } catch {}
}

// Migrate old single-chat format
function migrateOldHistory(): Msg[] | null {
  try {
    const old = localStorage.getItem("wrenchli-chat-history");
    if (old) {
      const msgs = JSON.parse(old) as Msg[];
      localStorage.removeItem("wrenchli-chat-history");
      if (msgs.length > 0) return msgs;
    }
  } catch {}
  return null;
}

export function getAllConversations(): Conversation[] {
  const convos = loadConversations();
  // Migrate old format if needed
  const oldMsgs = migrateOldHistory();
  if (oldMsgs && oldMsgs.length > 0) {
    const migrated: Conversation = {
      id: generateId(),
      title: generateTitle(oldMsgs),
      messages: oldMsgs.slice(-MAX_MESSAGES_PER_CONV),
      updatedAt: Date.now(),
    };
    convos.unshift(migrated);
    saveConversations(convos);
  }
  return convos;
}

export function getConversation(id: string): Conversation | undefined {
  return loadConversations().find((c) => c.id === id);
}

export function createConversation(): Conversation {
  const conv: Conversation = {
    id: generateId(),
    title: "New Chat",
    messages: [],
    updatedAt: Date.now(),
  };
  const convos = loadConversations();
  convos.unshift(conv);
  saveConversations(convos);
  return conv;
}

export function updateConversation(id: string, messages: Msg[]) {
  const convos = loadConversations();
  const idx = convos.findIndex((c) => c.id === id);
  if (idx === -1) return;
  convos[idx].messages = messages.slice(-MAX_MESSAGES_PER_CONV);
  convos[idx].title = generateTitle(messages);
  convos[idx].updatedAt = Date.now();
  // Move to top
  const [updated] = convos.splice(idx, 1);
  convos.unshift(updated);
  saveConversations(convos);
}

export function deleteConversation(id: string) {
  const convos = loadConversations().filter((c) => c.id !== id);
  saveConversations(convos);
}

export function renameConversation(id: string, title: string) {
  const convos = loadConversations();
  const idx = convos.findIndex((c) => c.id === id);
  if (idx === -1) return;
  convos[idx].title = title.trim() || "Untitled";
  convos[idx].updatedAt = Date.now();
  saveConversations(convos);
}

export function deleteAllConversations() {
  saveConversations([]);
}
