import { useState, useMemo, useRef, useEffect } from "react";
import { MessageSquarePlus, Trash2, MessageCircle, Search, X, Pencil, Check, Pin, PinOff, AlertTriangle, Download } from "lucide-react";
import type { Conversation } from "./conversationStore";
import { formatRelativeTime } from "./RelativeTime";
import { exportConversationAsText, exportConversationAsJson } from "./exportConversation";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete, onRename, onPin, onClearAll, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const list = search.trim()
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()))
        )
      : conversations;
    // Sort: pinned first, then by updatedAt
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [conversations, search]);

  const pinnedCount = filtered.filter((c) => c.pinned).length;

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  const startEditing = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditValue(conv.title);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</span>
        <button
          onClick={() => { onNew(); onClose(); }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-accent transition-colors"
          title="New chat"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-md border border-input bg-background pl-7 pr-7 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {search ? "No matching conversations" : "No conversations yet"}
          </p>
        ) : (
          <div className="py-1">
            {filtered.map((conv, idx) => (
              <div key={conv.id}>
                {/* Pinned/Unpinned section divider */}
                {pinnedCount > 0 && idx === pinnedCount && (
                  <div className="px-3 py-1">
                    <div className="border-t border-border" />
                  </div>
                )}
                <div
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    conv.id === activeId
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/50 text-foreground"
                  }`}
                  onClick={() => { onSelect(conv.id); onClose(); }}
                >
                  <div className="relative flex-shrink-0">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    {conv.pinned && (
                      <Pin className="h-2 w-2 text-primary absolute -top-1 -right-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === conv.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); commitRename(); }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          ref={editRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                          className="w-full text-xs font-medium bg-background border border-input rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-ring"
                        />
                      </form>
                    ) : (
                      <>
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {conv.messages.length} msg{conv.messages.length !== 1 ? "s" : ""} · {formatRelativeTime(conv.updatedAt)}
                        </p>
                      </>
                    )}
                  </div>
                  {editingId === conv.id ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); commitRename(); }}
                      className="p-1 rounded hover:bg-primary/10 text-primary transition-all"
                      title="Save"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); onPin(conv.id); }}
                        className="p-1 rounded hover:bg-accent transition-all"
                        title={conv.pinned ? "Unpin" : "Pin to top"}
                      >
                        {conv.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); exportConversationAsText(conv); }}
                        className="p-1 rounded hover:bg-accent transition-all"
                        title="Export as text"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => startEditing(conv, e)}
                        className="p-1 rounded hover:bg-accent transition-all"
                        title="Rename conversation"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear all footer */}
      {conversations.length > 1 && (
        <div className="border-t border-border px-3 py-2">
          {showClearConfirm ? (
            <div className="flex items-center gap-2 text-[10px]">
              <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
              <span className="text-destructive font-medium">Delete all?</span>
              <button
                onClick={() => { onClearAll(); setShowClearConfirm(false); }}
                className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-[10px] text-destructive hover:underline"
            >
              Delete all conversations
            </button>
          )}
        </div>
      )}
    </div>
  );
}
