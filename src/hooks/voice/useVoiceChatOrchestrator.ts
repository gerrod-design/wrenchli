import { useState, useRef, useCallback, useEffect } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useTextToSpeech } from "./useTextToSpeech";

/**
 * Orchestrator that composes STT + TTS into a unified voice-chat interface.
 * This is the single public API consumed by VoiceChatContext.
 */
export function useVoiceChat() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const voiceEnabledRef = useRef(false);

  const stt = useSpeechRecognition();

  // Stable ref for the auto-listen callback so TTS can call it without circular deps
  const autoListenRef = useRef<() => void>(() => {});

  // IMPORTANT: Use a stable callback reference so speak doesn't get recreated every render
  const onSpeechEndStable = useCallback(() => {
    autoListenRef.current();
  }, []);

  const tts = useTextToSpeech(voiceEnabledRef, onSpeechEndStable);

  const startListening = useCallback(
    (owner?: string): boolean => stt.startListening(voiceEnabledRef, tts.stopAudio, owner),
    [stt.startListening, tts.stopAudio],
  );

  // Keep the ref up-to-date
  autoListenRef.current = () => startListening();

  // Cancel everything when voice mode is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      tts.stopAudio();
      stt.resetOwner();
      stt.stopListening();
    }
  }, [voiceEnabled, tts.stopAudio, stt.resetOwner, stt.stopListening]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      voiceEnabledRef.current = next;
      if (prev) tts.resetLastSpoken();
      return next;
    });
  }, [tts.resetLastSpoken]);

  return {
    voiceEnabled,
    toggleVoice,
    isListening: stt.isListening,
    isSpeaking: tts.isSpeaking,
    transcript: stt.transcript,
    voiceOwner: stt.voiceOwner,
    setTranscript: stt.setTranscript,
    startListening,
    stopListening: stt.stopListening,
    speak: tts.speak,
    stopSpeaking: tts.stopSpeaking,
    unlockAudioPlayback: tts.unlockAudioPlayback,
    supportsSTT: stt.supportsSTT,
    supportsTTS: tts.supportsTTS,
    silenceCountdown: stt.silenceCountdown,
    waitForSpeechEnd: tts.waitForSpeechEnd,
  };
}
