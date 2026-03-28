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

export function useSharedVoiceChat(): VoiceChatContextType {
  const ctx = useContext(VoiceChatContext);
  if (!ctx) {
    // Fallback: create a local instance if provider is missing (e.g. HMR boundary)
    // This is safe because useVoiceChat is a pure hook with no side effects on mount
    return useVoiceChat();
  }
  return ctx;
}
