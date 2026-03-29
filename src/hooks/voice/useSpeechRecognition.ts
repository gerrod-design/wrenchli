import { useState, useRef, useCallback } from "react";

const SILENCE_TIMEOUT_MS = 4500;

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [silenceCountdown, setSilenceCountdown] = useState(0);
  const [voiceOwner, setVoiceOwner] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceStartRef = useRef<number>(0);
  const voiceOwnerRef = useRef<string | null>(null);

  const supportsSTT =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceCountdown(0);
  }, []);

  const startListening = useCallback(
    (voiceEnabledRef: React.RefObject<boolean>, stopAudio: () => void, owner?: string): boolean => {
      const resolvedOwner = owner ?? voiceOwnerRef.current ?? "global";
      if (owner || !voiceOwnerRef.current) {
        voiceOwnerRef.current = resolvedOwner;
        setVoiceOwner(resolvedOwner);
      }

      if (!supportsSTT || isListening || !voiceEnabledRef.current) return false;
      stopAudio();

      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return false;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        const resetSilenceTimer = () => {
          clearSilenceTimer();
          silenceStartRef.current = Date.now();
          setSilenceCountdown(1);
          countdownIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - silenceStartRef.current;
            const remaining = Math.max(0, 1 - elapsed / SILENCE_TIMEOUT_MS);
            setSilenceCountdown(remaining);
            if (remaining <= 0 && countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
          }, 50);
          silenceTimerRef.current = setTimeout(() => {
            recognition.stop();
          }, SILENCE_TIMEOUT_MS);
        };

        recognition.onstart = () => {
          setIsListening(true);
          resetSilenceTimer();
        };
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = Array.from(event.results)
            .map((r) => r[0].transcript)
            .join("");
          setTranscript(result);
          resetSilenceTimer();
        };
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event?.error ?? event);
          clearSilenceTimer();
          setIsListening(false);
          setTranscript("");
        };
        recognition.onend = () => {
          clearSilenceTimer();
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return true;
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        clearSilenceTimer();
        setIsListening(false);
        return false;
      }
    },
    [supportsSTT, isListening, clearSilenceTimer],
  );

  const stopListening = useCallback(
    (owner?: string) => {
      if (owner && voiceOwnerRef.current && voiceOwnerRef.current !== owner) return;

      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
    },
    [clearSilenceTimer],
  );

  const resetOwner = useCallback(() => {
    voiceOwnerRef.current = null;
    setVoiceOwner(null);
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    silenceCountdown,
    voiceOwner,
    voiceOwnerRef,
    supportsSTT,
    startListening,
    stopListening,
    resetOwner,
  };
}
