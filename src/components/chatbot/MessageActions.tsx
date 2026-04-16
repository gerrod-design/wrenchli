import { useState } from "react";
import { Copy, Share2, Check, FileDown } from "lucide-react";
import { toast } from "sonner";
import { exportDiagnosisPdf } from "./exportPdf";

interface Props {
  content: string;
}

export function MessageActions({ content }: Props) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const btnClass = "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors";

  return (
    <div className="flex items-center gap-1 mt-1 ml-1">
      <button
        onClick={() => {
          navigator.clipboard.writeText(content);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 2000);
        }}
        className={btnClass}
        title="Copy response"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>

      <button
        onClick={async () => {
          setExporting(true);
          try {
            await exportDiagnosisPdf(content);
            toast.success("PDF downloaded");
          } catch {
            toast.error("Failed to export PDF");
          } finally {
            setExporting(false);
          }
        }}
        disabled={exporting}
        className={btnClass}
        title="Save as PDF"
      >
        <FileDown className="h-3 w-3" />
        {exporting ? "Saving…" : "PDF"}
      </button>

      {typeof navigator.share === "function" && (
        <button
          onClick={() => {
            navigator.share({ title: "Wrenchli Assessment", text: content }).catch(() => {});
          }}
          className={btnClass}
          title="Share assessment"
        >
          <Share2 className="h-3 w-3" />
          Share
        </button>
      )}
    </div>
  );
}
