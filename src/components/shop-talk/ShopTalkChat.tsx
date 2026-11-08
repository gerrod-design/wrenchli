import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sendShopTalkMessage,
  type ShopTalkMessage,
} from "@/lib/shopTalk";

interface ShopTalkChatProps {
  /** The assistant's opening message (its first sentence discloses it is an AI). */
  greeting: string;
  conversationId: string;
}

/**
 * Text rung of /for-shops/talk: the shop-prospect assistant. Separate
 * configuration from the consumer Aiden chat (served by the shop-talk
 * edge function); this component only renders and relays.
 */
export default function ShopTalkChat({ greeting, conversationId }: ShopTalkChatProps) {
  const [messages, setMessages] = useState<ShopTalkMessage[]>([
    { role: "assistant", content: greeting },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const next: ShopTalkMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    setSending(true);
    setError(null);
    try {
      const reply = await sendShopTalkMessage(next, conversationId);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setError(
        "The assistant is having trouble right now. The booking form on this page still works, and a person will confirm your call.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto space-y-3 p-4"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-accent-foreground leading-relaxed"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 leading-relaxed"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-muted-foreground">
              Typing...
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="px-4 pb-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about the pilot..."
          aria-label="Type your question"
          maxLength={4000}
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !draft.trim()}>
          Send <Send className="ml-1.5 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
