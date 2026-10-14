import React from 'react';
import { X, AlertTriangle, CheckCircle2, Circle, MapPin } from 'lucide-react';
import type { SymptomAnalysisResponse } from '@/types/symptom';
import { SENSE_LABELS, SENSE_ICONS } from '@/data/senseChips';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SymptomResultsProps {
  result: SymptomAnalysisResponse;
  onClose: () => void;
  onScheduleShop?: () => void;
}

const URGENCY_CONFIG = {
  1: {
    label: 'Looks safe to drive — schedule a shop visit soon.',
    color: 'bg-green-100 text-green-800 border-green-300',
    alertBg: 'bg-green-50',
    alertBorder: 'border-green-200',
  },
  2: {
    label: 'Get it checked this week.',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    alertBg: 'bg-amber-50',
    alertBorder: 'border-amber-200',
  },
  3: {
    label: "Don't drive it.",
    color: 'bg-red-100 text-red-800 border-red-300',
    alertBg: 'bg-red-50',
    alertBorder: 'border-red-200',
  },
} as const;

export const SymptomResults: React.FC<SymptomResultsProps> = ({
  result,
  onClose,
  onScheduleShop,
}) => {
  const urgencyConfig = URGENCY_CONFIG[result.urgency];
  const allSenses = ['SEE', 'HEAR', 'SMELL', 'FEEL'] as const;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Preliminary Assessment
        </h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Urgency badge and reason */}
      <div className="space-y-3">
        <div
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold text-sm',
            urgencyConfig.color
          )}
        >
          {result.urgency === 3 && <AlertTriangle className="w-5 h-5" />}
          {urgencyConfig.label}
        </div>

        {result.urgencyReason && (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
            {result.urgencyReason}
          </p>
        )}
      </div>

      {/* Tier 3 alert box */}
      {result.urgency === 3 && (
        <div
          className={cn(
            'border-2 rounded-lg p-5 space-y-2',
            urgencyConfig.alertBg,
            urgencyConfig.alertBorder
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-bold text-red-900 text-lg">
                Don't drive it
              </p>
              <p className="text-red-800">
                Consider having your vehicle towed to a shop rather than driving it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assessment text */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Assessment</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {result.preliminaryAssessment}
        </p>
      </div>

      {/* Senses covered checklist */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Senses covered
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {allSenses.map((sense) => {
            const isCovered = result.sensesCovered.includes(sense);
            const label = SENSE_LABELS[sense];

            return (
              <div
                key={sense}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  isCovered
                    ? 'bg-white border-green-200'
                    : 'bg-gray-100 border-gray-200'
                )}
              >
                {isCovered ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span
                  className={cn('text-base leading-none', !isCovered && 'opacity-40')}
                  aria-hidden="true"
                >
                  {SENSE_ICONS[sense]}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCovered ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video insights (if available) */}
      {result.videoInsights && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
            What we found in your video
          </h3>
          <p className="text-blue-900 leading-relaxed">
            {result.videoInsights}
          </p>
        </div>
      )}

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 space-y-2">
        <h3 className="font-semibold text-gray-900">Just bought a car? Capture its baseline today.</h3>
        <p className="text-sm text-gray-700">
          Save dated photos, senses checks, and model-specific checks in your Garage while the vehicle is new to you.
        </p>
        <Button asChild variant="outline" className="bg-white">
          <a href="/garage">Open your Garage</a>
        </Button>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Close
        </Button>
        {onScheduleShop && (
          <Button
            onClick={onScheduleShop}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Find a Shop
          </Button>
        )}
      </div>
    </div>
  );
};
