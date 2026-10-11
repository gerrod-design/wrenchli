import React from 'react';
import { Video, ArrowLeft } from 'lucide-react';
import type { SenseBundle } from '@/types/symptom';
import { generateDirectedPrompt, getCoveredSenses } from '@/lib/symptomBundleBuilder';
import { SENSE_LABELS, SENSE_ICONS } from '@/data/senseChips';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DirectedVideoPromptProps {
  bundle: SenseBundle;
  onStartRecording: () => void;
  onBack: () => void;
}

export const DirectedVideoPrompt: React.FC<DirectedVideoPromptProps> = ({
  bundle,
  onStartRecording,
  onBack,
}) => {
  const promptText = generateDirectedPrompt(bundle);
  const coveredSenses = getCoveredSenses(bundle);

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
          {promptText}
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
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          What you reported
        </h3>
        <div className="space-y-2">
          {coveredSenses.map((sense) => {
            const Icon = SENSE_ICONS[sense.type];
            const label = SENSE_LABELS[sense.type];
            
            return (
              <div
                key={sense.type}
                className="flex items-start gap-3 text-sm"
              >
                <div className="flex items-center gap-2 min-w-[80px]">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-700">{label}</span>
                </div>
                <span className="text-gray-600">
                  {sense.descriptors.join(', ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

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
