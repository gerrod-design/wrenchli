import { createContext, useContext, type ReactNode } from "react";
import { useVoiceChat } from "@/hooks/useVoiceChat";

type VoiceChatContextType = ReturnType<typeof useVoiceChat>;

const VoiceChatContext = createContext<VoiceChatContextType | null>(null);

export function VoiceChatProvider({ children }: { children: ReactNode }) {
  const voice = useVoiceChat();
  return (
    <VoiceChatContext.Provider value={voice}>
      {children}
    </VoiceChatContext.Provider>
  );
}

/**
 * Returns the shared voice chat instance from context.
 * Falls back to a local instance if the provider is missing
 * (can happen during Vite HMR boundaries).
 */
export function useSharedVoiceChat(): VoiceChatContextType {
  const ctx = useContext(VoiceChatContext);
  const fallback = useVoiceChat();
  if (ctx) return ctx;
  return fallback;
}
