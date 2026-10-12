import React from 'react';
import { Video, ArrowLeft } from 'lucide-react';
import type { SenseBundle } from '@/types/symptom';
import { generateDirectedPrompt } from '@/lib/symptomBundleBuilder';
import { SENSE_LABELS, SENSE_ICONS } from '@/data/senseChips';
import { Button } from '@/components/ui/button';

interface DirectedVideoPromptProps {
  bundle?: SenseBundle | null;
  promptText?: string;
  onStartRecording: () => void;
  onBack: () => void;
}

export const DirectedVideoPrompt: React.FC<DirectedVideoPromptProps> = ({
  bundle,
  promptText,
  onStartRecording,
  onBack,
}) => {
  const displayedPrompt =
    promptText ?? (bundle ? generateDirectedPrompt(bundle) : '');

  // Summary rows come straight from the bundle's observations. (A previous
  // version mapped over getCoveredSenses() — plain sense strings — and read
  // .type/.descriptors off them, which threw at render time.)
  const summaryRows = bundle
    ? bundle.observations.filter(
        (obs) =>
          obs.descriptors.length > 0 ||
          (obs.freeText && obs.freeText.trim().length > 0)
      )
    : [];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header with icon */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <Video className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Let's capture what's happening
        </h2>
      </div>

      {/* Directed prompt instruction */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <p className="text-lg text-gray-800 leading-relaxed">
          {displayedPrompt}
        </p>
      </div>

      {/* Note about video/audio capture */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900 flex items-center gap-2">
          <span className="text-lg">📹🎤</span>
          <span>Video and audio will be captured together.</span>
        </p>
      </div>

      {/* Summary of what driver reported */}
      {summaryRows.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            What you reported
          </h3>
          <div className="space-y-2">
            {summaryRows.map((obs) => {
              const descriptorText = obs.descriptors.join(', ');
              const text =
                descriptorText && obs.freeText
                  ? `${descriptorText} (${obs.freeText})`
                  : descriptorText || (obs.freeText as string);

              return (
                <div
                  key={obs.sense}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <span className="text-base">{SENSE_ICONS[obs.sense]}</span>
                    <span className="font-medium text-gray-700">
                      {SENSE_LABELS[obs.sense]}
                    </span>
                  </div>
                  <span className="text-gray-600">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={onStartRecording}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Start Recording
        </Button>
      </div>
    </div>
  );
};
