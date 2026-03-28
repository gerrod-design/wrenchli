import { useState, useRef, useCallback, useEffect } from "react";
import type { AgentType } from "@/components/MechanicAvatar";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-tts`;

const SILENCE_TIMEOUT_MS = 4500;

export function useVoiceChat() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [silenceCountdown, setSilenceCountdown] = useState(0); // 0-1 progress (1 = full time left, 0 = about to stop)
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceStartRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");
  const voiceEnabledRef = useRef(false);

  // Load voices
  useEffect(() => {
    if (!synthRef.current) return;
    const loadVoices = () => {
      voicesRef.current = synthRef.current?.getVoices() ?? [];
    };
    loadVoices();
    synthRef.current.addEventListener("voiceschanged", loadVoices);
    return () => synthRef.current?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Cancel speech when voice mode is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
      stopListening();
    }
  }, [voiceEnabled]);

  const supportsSTT = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window;

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

  const startListening = useCallback(() => {
    if (!supportsSTT || isListening || !voiceEnabledRef.current) return;
    // Stop any ongoing speech before listening
    synthRef.current?.cancel();
    setIsSpeaking(false);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      resetSilenceTimer(); // Start initial timeout
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(result);
      resetSilenceTimer(); // Reset timeout on each speech result
    };
    recognition.onerror = () => {
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
  }, [supportsSTT, isListening, clearSilenceTimer]);

  const stopListening = useCallback(() => {
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

  const speak = useCallback((text: string, agent: AgentType) => {
    if (!supportsTTS || !voiceEnabled || !text) return;
    // Strip markdown formatting for cleaner speech
    const clean = text
      .replace(/\[Agent:\s*(?:Mike|Sam|Jess)\]\s*/gi, "")
      .replace(/[#*_~`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, ". ")
      .trim();

    if (!clean || clean === lastSpokenRef.current) return;
    lastSpokenRef.current = clean;

    synthRef.current?.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    const cfg = VOICE_CONFIGS[agent];
    utterance.pitch = cfg.pitch;
    utterance.rate = cfg.rate;

    const voice = pickVoice(voicesRef.current, agent);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-listen after agent finishes speaking — use ref for current value
      if (voiceEnabledRef.current) {
        setTimeout(() => {
          if (voiceEnabledRef.current) startListening();
        }, 400);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current?.speak(utterance);
  }, [supportsTTS, voiceEnabled, startListening]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
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
