import { memo, useCallback, useState } from "react";
import { AudioLines, Square, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface AudioRecordButtonProps {
  disabled?: boolean;
  onAnalysis: (text: string) => void;
  vehicleContext?: string;
}

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-car-audio`;

const AudioRecordButton = memo(function AudioRecordButton({
  disabled,
  onAnalysis,
  vehicleContext,
}: AudioRecordButtonProps) {
  const {
    isRecording,
    recordingDuration,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    supportsRecording,
  } = useAudioRecorder();

  const [analyzing, setAnalyzing] = useState(false);

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    const started = await startRecording();
    if (!started) {
      toast.error("Microphone access denied. Please allow mic permission.");
    } else {
      toast.info("🎤 Recording car noise… tap again to stop (30s max)", { duration: 3000 });
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleSendAudio = useCallback(async () => {
    if (!audioBlob) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "car-noise.webm");
      if (vehicleContext) formData.append("vehicle_context", vehicleContext);

      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to analyze audio");
      }

      const { analysis } = await response.json();
      clearRecording();
      onAnalysis(analysis);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze audio");
    } finally {
      setAnalyzing(false);
    }
  }, [audioBlob, vehicleContext, clearRecording, onAnalysis]);

  if (!supportsRecording) return null;

  // Show recorded clip preview
  if (audioBlob && !isRecording) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1">
          <span className="text-[10px] font-medium text-primary">{recordingDuration}s clip</span>
        </div>
        <button
          type="button"
          onClick={handleSendAudio}
          disabled={analyzing}
          className="flex h-8 items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 text-xs font-medium disabled:opacity-50"
          aria-label="Send audio for analysis"
        >
          {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "🔊 Analyze"}
        </button>
        <button
          type="button"
          onClick={clearRecording}
          disabled={analyzing}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          aria-label="Discard recording"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleRecord}
      disabled={disabled || analyzing}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
        isRecording
          ? "bg-destructive text-destructive-foreground ring-2 ring-destructive/50 ring-offset-1 ring-offset-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      aria-label={isRecording ? "Stop recording" : "Record car noise"}
      title={isRecording ? `Recording… ${recordingDuration}s` : "Record car noise"}
    >
      {isRecording ? (
        <>
          <Square className="h-3.5 w-3.5" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
          </span>
        </>
      ) : (
        <AudioLines className="h-4 w-4" />
      )}
    </button>
  );
});

export default AudioRecordButton;
