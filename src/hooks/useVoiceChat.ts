import { useState, useRef, useCallback, useEffect } from "react";
import type { AgentType } from "@/components/MechanicAvatar";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-tts`;

const SILENCE_TIMEOUT_MS = 4500;

export function useVoiceChat() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [silenceCountdown, setSilenceCountdown] = useState(0);
  const [voiceOwner, setVoiceOwner] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceStartRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");
  const voiceEnabledRef = useRef(false);
  const voiceOwnerRef = useRef<string | null>(null);

  // Cancel audio when voice mode is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      voiceOwnerRef.current = null;
      setVoiceOwner(null);
      stopListening();
    }
  }, [voiceEnabled]);

  const supportsSTT = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const supportsTTS = true; // Azure TTS is always available

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

  const startListening = useCallback((owner?: string): boolean => {
    const resolvedOwner = owner ?? voiceOwnerRef.current ?? "global";
    if (owner || !voiceOwnerRef.current) {
      voiceOwnerRef.current = resolvedOwner;
      setVoiceOwner(resolvedOwner);
    }

    if (!supportsSTT || isListening || !voiceEnabledRef.current) return false;
    // Stop any ongoing audio before listening
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return false;
      }

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
  }, [supportsSTT, isListening, clearSilenceTimer]);

  const stopListening = useCallback((owner?: string) => {
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
  }, [clearSilenceTimer]);

  // Browser fallback TTS — must be declared before `speak` to keep hook order stable.
  const speakWithBrowserTTS = useCallback((text: string, agent: AgentType) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.error("Browser speech synthesis not available");
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = agent === "sam" ? "en-GB" : "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      if (voiceEnabledRef.current) {
        setTimeout(() => {
          if (voiceEnabledRef.current) startListening();
        }, 400);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  const speak = useCallback(async (text: string, agent: AgentType) => {
    if (!voiceEnabledRef.current || !text) return;
    // Strip markdown formatting for cleaner speech
    const clean = text
      .replace(/\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]\s*/gi, "")
      .replace(/[#*_~`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, ". ")
      .trim();

    if (!clean || clean === lastSpokenRef.current) return;
    lastSpokenRef.current = clean;

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);

    try {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: clean, agent }),
      });

      if (!response.ok) {
        console.error("Azure TTS error:", response.status);
        throw new Error(`Azure TTS ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        // Auto-listen after agent finishes speaking
        if (voiceEnabledRef.current) {
          setTimeout(() => {
            if (voiceEnabledRef.current) startListening();
          }, 400);
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        console.warn("Cloud TTS audio playback failed, falling back to browser speech synthesis");
        speakWithBrowserTTS(clean, agent);
      };

      await audio.play();
    } catch (err) {
      console.warn("Cloud TTS failed, falling back to browser speech synthesis:", err);
      speakWithBrowserTTS(clean, agent);
    }
  }, [startListening, speakWithBrowserTTS]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      voiceEnabledRef.current = next;
      if (prev) {
        lastSpokenRef.current = "";
      }
      return next;
    });
  }, []);

  return {
    voiceEnabled,
    toggleVoice,
    isListening,
    isSpeaking,
    transcript,
    voiceOwner,
    setTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    supportsSTT,
    supportsTTS,
    silenceCountdown,
  };
}
