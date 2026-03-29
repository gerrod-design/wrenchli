import { useState, useRef, useCallback } from "react";
import type { AgentType } from "@/components/MechanicAvatar";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-tts`;

/** Strip markdown / agent tags for cleaner speech output. */
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]\s*/gi, "")
    .replace(/[#*_~`>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, ". ")
    .trim();
}

export function useTextToSpeech(
  voiceEnabledRef: React.RefObject<boolean>,
  onSpeechEnd: () => void,
) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");

  const supportsTTS = true; // Azure TTS is always available

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speakWithBrowserTTS = useCallback(
    (text: string, agent: AgentType) => {
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
            if (voiceEnabledRef.current) onSpeechEnd();
          }, 400);
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabledRef, onSpeechEnd],
  );

  const speak = useCallback(
    async (text: string, agent: AgentType) => {
      console.log("[SpeakTrace] speak() called, voiceEnabledRef:", voiceEnabledRef.current, "textLen:", text?.length);
      if (!voiceEnabledRef.current || !text) return;

      const clean = cleanTextForSpeech(text);
      console.log("[SpeakTrace] dedup check:", clean === lastSpokenRef.current, "cleanLen:", clean.length);
      if (!clean || clean === lastSpokenRef.current) return;
      lastSpokenRef.current = clean;

      stopAudio();
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
          if (voiceEnabledRef.current) {
            setTimeout(() => {
              if (voiceEnabledRef.current) onSpeechEnd();
            }, 400);
          }
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          console.warn("Cloud TTS playback failed, falling back to browser speech synthesis");
          speakWithBrowserTTS(clean, agent);
        };

        await audio.play();
      } catch (err) {
        console.warn("Cloud TTS failed, falling back to browser speech synthesis:", err);
        speakWithBrowserTTS(clean, agent);
      }
    },
    [voiceEnabledRef, onSpeechEnd, stopAudio, speakWithBrowserTTS],
  );

  const resetLastSpoken = useCallback(() => {
    lastSpokenRef.current = "";
  }, []);

  return {
    isSpeaking,
    supportsTTS,
    speak,
    stopSpeaking: stopAudio,
    stopAudio,
    resetLastSpoken,
  };
}
