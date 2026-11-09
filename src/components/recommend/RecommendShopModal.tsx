import { X } from "lucide-react";
import RecommendShopForm from "./RecommendShopForm";

interface RecommendShopModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RecommendShopModal({ open, onClose }: RecommendShopModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90%] md:max-w-[560px] md:rounded-2xl rounded-t-2xl bg-background max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-4">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <RecommendShopForm variant="modal" onClose={onClose} />
      </div>
    </div>
  );
}
