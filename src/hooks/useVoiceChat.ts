import { useState, useRef, useCallback, useEffect } from "react";
import type { AgentType } from "@/components/MechanicAvatar";

// Different voice configs per avatar for distinct personalities
const VOICE_CONFIGS: Record<AgentType, { pitch: number; rate: number; voiceName?: string }> = {
  mike: { pitch: 1.0, rate: 1.0, voiceName: "Google US English" },
  sam: { pitch: 0.85, rate: 0.95, voiceName: "Google UK English Female" },
  jess: { pitch: 1.15, rate: 1.05, voiceName: "Google US English" },
};

// Find the best matching voice for an agent
function pickVoice(voices: SpeechSynthesisVoice[], agent: AgentType): SpeechSynthesisVoice | undefined {
  const cfg = VOICE_CONFIGS[agent];
  // Try preferred name first
  if (cfg.voiceName) {
    const match = voices.find((v) => v.name.includes(cfg.voiceName!));
    if (match) return match;
  }
  // Fallback: female for jess/sam, male-ish for mike
  if (agent === "jess" || agent === "sam") {
    return voices.find((v) => /female/i.test(v.name) && v.lang.startsWith("en")) || voices.find((v) => v.lang.startsWith("en"));
  }
  return voices.find((v) => /male/i.test(v.name) && !/female/i.test(v.name) && v.lang.startsWith("en")) || voices.find((v) => v.lang.startsWith("en"));
}

export function useVoiceChat() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const lastSpokenRef = useRef("");

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
  }, []);

  const startListening = useCallback(() => {
    if (!supportsSTT || isListening) return;
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
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 3000); // 3 seconds of silence → auto-stop
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
    recognitionRef.current?.stop();
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
      // Auto-listen after agent finishes speaking
      if (voiceEnabled) {
        setTimeout(() => startListening(), 400);
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
      if (prev) {
        lastSpokenRef.current = "";
      }
      return !prev;
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
  };
}
