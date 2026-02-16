import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, TrendingUp, TrendingDown, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecallAlerts, RecallAlert } from "@/hooks/useRecallAlerts";
import { useMarketValueAlerts, MarketValueAlert } from "@/hooks/useMarketValueAlerts";
import { Link } from "react-router-dom";

type UnifiedAlert =
  | { kind: "recall"; data: RecallAlert }
  | { kind: "market"; data: MarketValueAlert };

export default function NotificationBell() {
  const { alerts: recallAlerts, unreadCount: recallCount, markAsRead: markRecallRead, markAllAsRead: markAllRecallsRead } = useRecallAlerts();
  const { alerts: marketAlerts, unreadCount: marketCount, markAsRead: markMarketRead, markAllAsRead: markAllMarketsRead } = useMarketValueAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const totalUnread = recallCount + marketCount;

  // Merge and sort by created_at descending
  const unified: UnifiedAlert[] = [
    ...recallAlerts.map((a) => ({ kind: "recall" as const, data: a })),
    ...marketAlerts.map((a) => ({ kind: "market" as const, data: a })),
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (totalUnread === 0) return null;

  const handleMarkAllRead = () => {
    markAllRecallsRead();
    markAllMarketsRead();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/10"
        aria-label={`${totalUnread} unread notifications`}
      >
        <Bell className="h-5 w-5 text-primary-foreground/80" />
        <span className="absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground min-w-[18px] h-[18px] px-1">
          {totalUnread > 9 ? "9+" : totalUnread}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-card-foreground">Notifications</h3>
            {totalUnread > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
          <ul className="divide-y divide-border">
            {unified.slice(0, 12).map((item) => (
              <li key={item.data.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                {item.kind === "recall" ? (
                  <RecallAlertRow alert={item.data} onDismiss={markRecallRead} />
                ) : (
                  <MarketAlertRow alert={item.data} onDismiss={markMarketRead} />
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <Link
              to="/garage"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-accent hover:underline"
            >
              View all in Garage →
            </Link>
            <Link
              to="/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function RecallAlertRow({ alert, onDismiss }: { alert: RecallAlert; onDismiss: (id: string) => void }) {
  return (
    <div className="flex items-start gap-2">
      <AlertTriangle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
        alert.priority === "urgent" ? "text-destructive" : "text-amber-500"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">{alert.component}</p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{alert.summary}</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">Recall #{alert.campaign_number}</p>
      </div>
      <button onClick={() => onDismiss(alert.id)} className="flex-shrink-0 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MarketAlertRow({ alert, onDismiss }: { alert: MarketValueAlert; onDismiss: (id: string) => void }) {
  const isUp = alert.change_direction === "increase";
  return (
    <div className="flex items-start gap-2">
      {isUp ? (
        <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
      ) : (
        <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">
          Market Value {isUp ? "Increased" : "Decreased"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{alert.summary}</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          {isUp ? "+" : "-"}{alert.change_percent.toFixed(1)}%
        </p>
      </div>
      <button onClick={() => onDismiss(alert.id)} className="flex-shrink-0 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
