import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import SEO from "@/components/SEO";
import specMarkdown from "../../docs/wrenchli-daily-digest-spec-v1.md?raw";

export default function AdminDigestSpec() {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    setContent(specMarkdown);
  }, []);

  const handleDownload = () => {
    const blob = new Blob([specMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wrenchli-daily-digest-spec-v1.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container-wrenchli py-10 max-w-4xl">
      <SEO
        title="Daily Digest — Phase 1 Spec"
        description="Internal specification for the Wrenchli daily C-suite digest to founder."
        path="/admin/digest-spec"
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Internal · Phase 1 Spec · Pending Founder Review
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold">
            Wrenchli Daily Digest
          </h1>
        </div>
        <button
          onClick={handleDownload}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Download .md
        </button>
      </div>
      <article className="prose prose-sm max-w-none prose-headings:font-heading prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-table:text-sm">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </main>
  );
}
