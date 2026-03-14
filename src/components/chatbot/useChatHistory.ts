import { useState, useEffect } from "react";
import type { Msg } from "./types";

const STORAGE_KEY = "wrenchli-chat-history";
const MAX_MESSAGES = 100;

export function useChatHistory() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as Msg[];
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      const toSave = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { messages, setMessages, clearHistory };
}
