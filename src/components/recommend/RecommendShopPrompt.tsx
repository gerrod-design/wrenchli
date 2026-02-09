import { MessageCircle } from "lucide-react";

interface RecommendShopPromptProps {
  onOpenModal: () => void;
}

export default function RecommendShopPrompt({ onOpenModal }: RecommendShopPromptProps) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="h-4 w-4 text-wrenchli-teal" />
        <span className="text-sm font-semibold">Know a great shop?</span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        Help us bring your trusted mechanic to Wrenchli.
      </p>
      <button
        onClick={onOpenModal}
        className="text-sm font-semibold text-wrenchli-teal hover:underline"
      >
        Recommend a Shop →
      </button>
    </div>
  );
}
