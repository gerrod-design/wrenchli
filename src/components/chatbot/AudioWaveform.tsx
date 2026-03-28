import { memo } from "react";

const BAR_COUNT = 5;
const DELAYS = [0, 0.15, 0.3, 0.12, 0.25];

/** Tiny animated waveform bars shown when the mic is actively listening. */
const AudioWaveform = memo(function AudioWaveform() {
  return (
    <div className="flex items-center gap-[2px] h-5" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-destructive"
          style={{
            animation: `waveform 0.8s ease-in-out ${DELAYS[i]}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveform {
          0%   { height: 4px; opacity: 0.5; }
          100% { height: 16px; opacity: 1; }
        }
      `}</style>
    </div>
  );
});

export default AudioWaveform;
