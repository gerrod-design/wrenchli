import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
}

const MAX_DURATION_MS = 30_000; // 30 seconds max
const WAV_MIME_TYPE = "audio/wav";
const TARGET_SAMPLE_RATE = 24_000;

type BrowserAudioContext = typeof AudioContext;

function getAudioContextCtor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as unknown as { webkitAudioContext?: BrowserAudioContext }).webkitAudioContext || null;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function mergeChunks(chunks: Float32Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function encodeWavSamples(samples: Float32Array, sourceSampleRate: number): Blob {
  const sampleRate = Math.min(sourceSampleRate, TARGET_SAMPLE_RATE);
  const sampleCount = Math.max(1, Math.ceil(samples.length * (sampleRate / sourceSampleRate)));
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < sampleCount; i += 1) {
    const sourceIndex = i * (sourceSampleRate / sampleRate);
    const lower = Math.min(Math.floor(sourceIndex), samples.length - 1);
    const upper = Math.min(lower + 1, samples.length - 1);
    const sample = Math.max(-1, Math.min(1, samples[lower] + (samples[upper] - samples[lower]) * (sourceIndex - lower)));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([wavBuffer], { type: WAV_MIME_TYPE });
}

function encodeAudioBuffer(buffer: AudioBuffer): Blob {
  const mono = new Float32Array(buffer.length);
  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    const channel = buffer.getChannelData(channelIndex);
    for (let i = 0; i < channel.length; i += 1) mono[i] += channel[i] / buffer.numberOfChannels;
  }
  return encodeWavSamples(mono, buffer.sampleRate);
}

async function convertRecordingToWav(blob: Blob): Promise<Blob> {
  if (blob.type.toLowerCase().includes("wav")) return blob;
  const AudioContextCtor = getAudioContextCtor();
  if (!AudioContextCtor) throw new Error("Audio conversion is not supported on this device.");

  const audioContext = new AudioContextCtor();
  try {
    const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
    return encodeAudioBuffer(decoded);
  } finally {
    void audioContext.close();
  }
}

function getRecordingMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const preferredTypes = isIOS
    ? ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

  return preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const sampleChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(TARGET_SAMPLE_RATE);

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  }, []);

  const cleanupAudioGraph = useCallback((stopStream = true) => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silentGainRef.current?.disconnect();
    void audioContextRef.current?.close();
    if (stopStream) streamRef.current?.getTracks().forEach((track) => track.stop());
    processorRef.current = null;
    sourceRef.current = null;
    silentGainRef.current = null;
    audioContextRef.current = null;
    if (stopStream) streamRef.current = null;
  }, []);

  const armTimers = useCallback((onMaxDuration: () => void) => {
    startTimeRef.current = Date.now();
    setIsRecording(true);
    setRecordingDuration(0);

    timerRef.current = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);

    maxTimerRef.current = setTimeout(onMaxDuration, MAX_DURATION_MS);
  }, []);

  const finishWebAudioRecording = useCallback(() => {
    cleanupTimers();
    const elapsed = Math.min(30, Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)));
    const samples = mergeChunks(sampleChunksRef.current);
    cleanupAudioGraph();
    setRecordingDuration(elapsed);
    setAudioBlob(samples.length ? encodeWavSamples(samples, sampleRateRef.current) : null);
    setIsRecording(false);
  }, [cleanupAudioGraph, cleanupTimers]);

  useEffect(() => () => {
    cleanupTimers();
    cleanupAudioGraph();
  }, [cleanupAudioGraph, cleanupTimers]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setAudioBlob(null);

      const AudioContextCtor = getAudioContextCtor();
      if (AudioContextCtor) {
        try {
          const audioContext = new AudioContextCtor();
          await audioContext.resume();
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, Math.max(1, source.channelCount || 1), 1);
          const silentGain = audioContext.createGain();
          silentGain.gain.value = 0;

          sampleChunksRef.current = [];
          sampleRateRef.current = audioContext.sampleRate;
          processor.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer;
            const frameCount = inputBuffer.length;
            const mono = new Float32Array(frameCount);
            for (let channelIndex = 0; channelIndex < inputBuffer.numberOfChannels; channelIndex += 1) {
              const channel = inputBuffer.getChannelData(channelIndex);
              for (let i = 0; i < frameCount; i += 1) mono[i] += channel[i] / inputBuffer.numberOfChannels;
            }
            sampleChunksRef.current.push(mono);
          };

          source.connect(processor);
          processor.connect(silentGain);
          silentGain.connect(audioContext.destination);
          audioContextRef.current = audioContext;
          sourceRef.current = source;
          processorRef.current = processor;
          silentGainRef.current = silentGain;
          mediaRecorderRef.current = null;

          armTimers(() => finishWebAudioRecording());
          return true;
        } catch {
          cleanupAudioGraph(false);
        }
      }

      const mimeType = getRecordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        cleanupTimers();
        stream.getTracks().forEach((t) => t.stop());
        const elapsed = Math.min(30, Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)));
        const blob = new Blob(chunksRef.current, { type: mimeType || chunksRef.current[0]?.type || "audio/webm" });
        void convertRecordingToWav(blob)
          .then(setAudioBlob)
          .catch(() => setAudioBlob(blob))
          .finally(() => {
            setRecordingDuration(elapsed);
            setIsRecording(false);
          });
      };

      recorder.onerror = () => {
        cleanupTimers();
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      armTimers(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      });

      return true;
    } catch {
      cleanupTimers();
      cleanupAudioGraph();
      return false;
    }
  }, [armTimers, cleanupAudioGraph, cleanupTimers, finishWebAudioRecording]);

  const stopRecording = useCallback(() => {
    if (audioContextRef.current) {
      finishWebAudioRecording();
      return;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [finishWebAudioRecording]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingDuration(0);
  }, []);

  const supportsRecording = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof window !== "undefined";

  return {
    isRecording,
    recordingDuration,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    supportsRecording,
  };
}
