import { useState, useCallback } from "react";
import { Cpu, Loader2, AlertCircle, Video, ShoppingCart, Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface DiagnosisResultProps {
  codes?: string;
  symptom?: string;
  year?: string;
  make?: string;
  model?: string;
}

const DIAGNOSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnose`;

export default function DiagnosisResult({ codes, symptom, year, make, model }: DiagnosisResultProps) {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState("");

  const runDiagnosis = useCallback(async () => {
    setIsLoading(true);
    setResult("");
    setError("");
    setHasRun(true);

    try {
      const resp = await fetch(DIAGNOSE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ codes, symptom, year, make, model }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data.error || "Failed to get diagnosis";
        if (resp.status === 429) toast.error("Rate limit exceeded. Please try again shortly.");
        else if (resp.status === 402) toast.error("AI service temporarily unavailable.");
        else toast.error(msg);
        setError(msg);
        setIsLoading(false);
        return;
      }

      if (!resp.body) {
        setError("No response body");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Diagnosis error:", e);
      setError("Failed to connect to diagnosis service. Please try again.");
      toast.error("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [codes, symptom, year, make, model]);

  const hasInput = Boolean(codes || symptom);
  const vehicleStr = [year, make, model].filter(Boolean).join(" ");

  if (!hasInput) return null;

  return (
    <section className="section-padding bg-secondary">
      <div className="container-wrenchli max-w-3xl">
        <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">
          {hasRun ? "Your Diagnosis" : "Ready to Diagnose"}
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          {hasRun
            ? `AI-powered analysis${vehicleStr ? ` for your ${vehicleStr}` : ""}`
            : `Get an AI-powered diagnosis${vehicleStr ? ` for your ${vehicleStr}` : ""}`}
        </p>

        {!hasRun && (
          <div className="mt-8 text-center">
            <Button
              onClick={runDiagnosis}
              size="lg"
              className="h-14 px-10 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-bold text-lg transition-transform hover:scale-[1.02]"
            >
              <Cpu className="mr-2 h-5 w-5" />
              Run AI Diagnosis
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Free • No account required • Powered by AI
            </p>
          </div>
        )}

        {isLoading && !result && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-wrenchli-teal" />
            <p className="text-sm text-muted-foreground">Analyzing your vehicle issue...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-destructive mb-2" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={runDiagnosis}
              variant="outline"
              size="sm"
              className="mt-4 border-destructive text-destructive hover:bg-destructive/10"
            >
              Try Again
            </Button>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              {codes && (
                <div className="flex items-center gap-2 text-xs font-mono text-wrenchli-teal mb-4">
                  <Cpu className="h-4 w-4" /> {codes}
                </div>
              )}
              <div className="prose prose-sm max-w-none text-foreground">
                {result.split("\n").map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <br key={i} />;
                  if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                    return (
                      <h3 key={i} className="font-heading text-base font-bold mt-4 mb-1 first:mt-0">
                        {trimmed.replace(/\*\*/g, "")}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith("- ")) {
                    return (
                      <div key={i} className="flex items-start gap-2 ml-2 text-sm text-muted-foreground">
                        <span className="text-wrenchli-teal mt-1 shrink-0">•</span>
                        <span>{trimmed.slice(2)}</span>
                      </div>
                    );
                  }
                  if (/^\d+\.\s/.test(trimmed)) {
                    return (
                      <div key={i} className="flex items-start gap-2 ml-2 text-sm text-muted-foreground">
                        <span className="text-wrenchli-teal font-semibold mt-0 shrink-0">
                          {trimmed.match(/^\d+/)?.[0]}.
                        </span>
                        <span>{trimmed.replace(/^\d+\.\s*/, "")}</span>
                      </div>
                    );
                  }
                  return (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {isLoading && (
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                </div>
              )}
            </div>

            {/* Action cards */}
            {!isLoading && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <Video className="mx-auto h-6 w-6 text-wrenchli-teal mb-2" />
                  <h4 className="font-heading text-sm font-semibold">Watch & Learn</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Tutorials for your vehicle</p>
                  <Button size="sm" variant="outline" className="mt-3 text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
                    Watch How-To Video
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <ShoppingCart className="mx-auto h-6 w-6 text-wrenchli-teal mb-2" />
                  <h4 className="font-heading text-sm font-semibold">Order Parts</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Right part, ship or pickup</p>
                  <Button size="sm" variant="outline" className="mt-3 text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
                    Shop Parts
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <Wrench className="mx-auto h-6 w-6 text-accent mb-2" />
                  <h4 className="font-heading text-sm font-semibold">Get It Fixed</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Quotes from local shops</p>
                  <Button size="sm" asChild className="mt-3 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/#quote">Get Shop Quotes <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && (
              <p className="text-center text-xs text-muted-foreground italic">
                This diagnosis is AI-generated and for informational purposes only. Always consult a qualified mechanic for serious issues.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
