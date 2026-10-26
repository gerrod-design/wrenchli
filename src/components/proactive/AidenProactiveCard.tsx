import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProactiveMessage } from "@/hooks/useProactiveMessages";
import { CARD_SPEAKER, DISMISS_LABEL } from "@/lib/proactive/copy";

// Proactive Events Phase 1 — the one place Aiden speaks first.
//
// Renders at most one card: the message the delivery gate selected, its
// reason line, exactly one primary action (deep link to the record), and
// the "Stop messages like this" dismissal (permanent for that record).
// Renders nothing when there is no message, during quiet hours, or when
// the user has opted out — those decisions all live in the delivery gate.

export default function AidenProactiveCard() {
  const { message, loading, markShown, dismiss } = useProactiveMessage();
  const shownForRef = useRef<string | null>(null);

  useEffect(() => {
    if (message && shownForRef.current !== message.id) {
      shownForRef.current = message.id;
      void markShown(message.id);
    }
  }, [message, markShown]);

  if (loading || !message) return null;

  return (
    <Card className="border-accent/30 bg-accent/5" data-testid="aiden-proactive-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/15">
            <MessageCircle className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{CARD_SPEAKER}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{message.reason}</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{message.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link to={message.actionPath}>{message.actionLabel}</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => void dismiss(message.id)}
              >
                {DISMISS_LABEL}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
