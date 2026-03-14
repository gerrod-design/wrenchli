import { useState, useCallback, useEffect } from "react";
import type { Msg } from "./types";
import {
  getAllConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  deleteAllConversations,
  renameConversation as renameConv,
  togglePinConversation as togglePinConv,
  type Conversation,
} from "./conversationStore";

export function useChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>(() => getAllConversations());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const convos = getAllConversations();
    return convos.length > 0 ? convos[0].id : null;
  });

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const setMessages = useCallback(
    (updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
      if (!activeId) return;
      setConversations((prev) => {
        const convos = [...prev];
        const idx = convos.findIndex((c) => c.id === activeId);
        if (idx === -1) return prev;
        const currentMsgs = convos[idx].messages;
        const newMsgs = typeof updater === "function" ? updater(currentMsgs) : updater;
        convos[idx] = { ...convos[idx], messages: newMsgs, updatedAt: Date.now() };
        // Update title from first user message
        const firstUser = newMsgs.find((m) => m.role === "user");
        if (firstUser) {
          const text = firstUser.content.slice(0, 40);
          convos[idx].title = text.length < firstUser.content.length ? text + "…" : text;
        }
        updateConversation(activeId, newMsgs);
        return convos;
      });
    },
    [activeId]
  );

  const startNewChat = useCallback(() => {
    const conv = createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, []);

  const switchConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const removeConversation = useCallback(
    (id: string) => {
      deleteConversation(id);
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        if (activeId === id) {
          setActiveId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
      });
    },
    [activeId]
  );

  const clearAllHistory = useCallback(() => {
    deleteAllConversations();
    setConversations([]);
    setActiveId(null);
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    renameConv(id, title);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: title.trim() || "Untitled", updatedAt: Date.now() } : c))
    );
  }, []);

  // Auto-create first conversation if none exist
  useEffect(() => {
    if (conversations.length === 0 && activeId === null) {
      // Don't auto-create — let the empty state show
    }
  }, [conversations, activeId]);

  return {
    messages,
    setMessages,
    conversations,
    activeId,
    startNewChat,
    switchConversation,
    removeConversation,
    renameConversation,
    clearAllHistory,
  };
}
