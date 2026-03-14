import type { Conversation } from "./conversationStore";

export function exportConversationAsText(conv: Conversation) {
  const header = `Wrenchli Conversation: ${conv.title}\nExported: ${new Date().toLocaleString()}\nMessages: ${conv.messages.length}\n${"─".repeat(40)}\n\n`;
  const body = conv.messages
    .map((m) => `[${m.role === "user" ? "You" : "Wrenchli"}]\n${m.content}`)
    .join("\n\n");
  const blob = new Blob([header + body], { type: "text/plain" });
  downloadBlob(blob, `wrenchli-chat-${Date.now()}.txt`);
}

export function exportConversationAsJson(conv: Conversation) {
  const data = {
    title: conv.title,
    exportedAt: new Date().toISOString(),
    messageCount: conv.messages.length,
    messages: conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.image_urls?.length ? { imageUrls: m.image_urls } : {}),
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `wrenchli-chat-${Date.now()}.json`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
