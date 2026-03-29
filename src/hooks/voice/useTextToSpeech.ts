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
  const activeObjectUrlRef = useRef<string | null>(null);
  const lastSpokenRef = useRef("");
  const playbackUnlockedRef = useRef(false);

  const supportsTTS = true; // Azure TTS is always available

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const unlockAudioPlayback = useCallback(async () => {
    if (playbackUnlockedRef.current) return true;
    if (typeof window === "undefined") return false;

    try {
      const primer = new Audio(
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
      );
      // IMPORTANT: keep this unmuted so browsers treat it as real media playback
      // in response to a user gesture and fully unlock subsequent audio.
      primer.muted = false;
      primer.volume = 1;
      primer.setAttribute("playsinline", "true");
      primer.preload = "auto";
      await primer.play();
      primer.pause();
      playbackUnlockedRef.current = true;
      return true;
    } catch (err) {
      console.warn("Audio playback unlock failed:", err);
      return false;
    }
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
      if (!voiceEnabledRef.current || !text) return;

      const clean = cleanTextForSpeech(text);
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
        activeObjectUrlRef.current = audioUrl;

        // Reuse one audio element to keep playback unlocked on mobile browsers.
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = audioUrl;
        audio.muted = false;
        audio.volume = 1;
        audio.preload = "auto";
        audio.setAttribute("playsinline", "true");

        audio.onended = () => {
          setIsSpeaking(false);
          if (activeObjectUrlRef.current) {
            URL.revokeObjectURL(activeObjectUrlRef.current);
            activeObjectUrlRef.current = null;
          }
          if (voiceEnabledRef.current) {
            setTimeout(() => {
              if (voiceEnabledRef.current) onSpeechEnd();
            }, 400);
          }
        };

        audio.onerror = () => {
          if (activeObjectUrlRef.current) {
            URL.revokeObjectURL(activeObjectUrlRef.current);
            activeObjectUrlRef.current = null;
          }
          console.warn("Cloud TTS playback failed, falling back to browser speech synthesis");
          speakWithBrowserTTS(clean, agent);
        };

        try {
          await audio.play();
        } catch (playErr) {
          // Mobile browsers can still reject play() if unlock wasn't fully registered.
          // Retry once after explicit unlock before falling back.
          const unlocked = await unlockAudioPlayback();
          if (unlocked) {
            await audio.play();
          } else {
            throw playErr;
          }
        }
      } catch (err) {
        console.warn("Cloud TTS failed, falling back to browser speech synthesis:", err);
        speakWithBrowserTTS(clean, agent);
      }
    },
    [voiceEnabledRef, onSpeechEnd, stopAudio, speakWithBrowserTTS, unlockAudioPlayback],
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
    unlockAudioPlayback,
    resetLastSpoken,
  };
}
