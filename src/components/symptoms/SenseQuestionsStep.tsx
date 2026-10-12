import { useState } from 'react';
import type {
  SenseType,
  SenseObservation,
  SenseBundle,
  TimingDescriptor,
} from '@/types/symptom';
import {
  SENSE_CHIPS,
  TIMING_CHIPS,
  SENSE_ICONS,
  SENSE_ORDER,
} from '@/data/senseChips';
import { buildSenseBundle } from '@/lib/symptomBundleBuilder';
import { ChipGrid } from './ChipGrid';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SenseQuestionSection {
  sense: SenseType;
  heading: string;
  escapeChip?: string;
}

export interface SenseQuestionsStepProps {
  title: string;
  subtitle?: string;
  sections: SenseQuestionSection[];
  showTiming?: boolean;
  requireSense?: SenseType;
  primaryLabel: string;
  onSubmit: (bundle: SenseBundle) => void;
  secondaryAction?: {
    label: string;
    hint?: string;
    onAction: (bundle: SenseBundle) => void;
  };
  onBack?: () => void;
}

function createEmptySenseRecord<T>(value: T): Record<SenseType, T> {
  return SENSE_ORDER.reduce((acc, sense) => {
    acc[sense] = value;
    return acc;
  }, {} as Record<SenseType, T>);
}

export function SenseQuestionsStep(props: SenseQuestionsStepProps) {
  const {
    title,
    subtitle,
    sections,
    showTiming,
    requireSense,
    primaryLabel,
    onSubmit,
    secondaryAction,
    onBack,
  } = props;

  const [selected, setSelected] = useState<Record<SenseType, string[]>>(() =>
    createEmptySenseRecord<string[]>([])
  );
  const [freeTexts, setFreeTexts] = useState<Record<SenseType, string>>(() =>
    createEmptySenseRecord<string>('')
  );
  const [freeTextOpen, setFreeTextOpen] = useState<Record<SenseType, boolean>>(
    () => createEmptySenseRecord<boolean>(false)
  );
  const [timing, setTiming] = useState<string[]>([]);

  const toggleDescriptor = (sense: SenseType, value: string, escapeChip?: string) => {
    setSelected(prev => {
      const current = prev[sense];
      let next: string[];
      if (escapeChip && value === escapeChip) {
        next = current.includes(value) ? current.filter(c => c !== value) : [value];
      } else {
        const withoutEscape = escapeChip
          ? current.filter(c => c !== escapeChip)
          : current;
        next = withoutEscape.includes(value)
          ? withoutEscape.filter(c => c !== value)
          : [...withoutEscape, value];
      }
      return { ...prev, [sense]: next };
    });
  };

  const toggleTiming = (value: string) => {
    setTiming(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  const toggleFreeTextOpen = (sense: SenseType) => {
    setFreeTextOpen(prev => ({ ...prev, [sense]: !prev[sense] }));
  };

  const setFreeText = (sense: SenseType, value: string) => {
    setFreeTexts(prev => ({ ...prev, [sense]: value }));
  };

  const buildBundle = (): SenseBundle => {
    const observations: SenseObservation[] = SENSE_ORDER.map(sense => ({
      sense,
      descriptors: selected[sense],
      freeText: freeTexts[sense]?.trim() ? freeTexts[sense] : undefined,
    }));
    return buildSenseBundle(observations, timing as TimingDescriptor[], [], []);
  };

  const canContinue = (): boolean => {
    if (!requireSense) return true;
    const hasChip = selected[requireSense].length > 0;
    const hasText = !!freeTexts[requireSense]?.trim();
    return hasChip || hasText;
  };

  const continueEnabled = canContinue();

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-6 p-4 max-w-2xl mx-auto w-full">
        {onBack && (
          <div>
            <Button
              type="button"
              variant="ghost"
              className="px-0"
              onClick={onBack}
            >
              ← Back
            </Button>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>

        {sections.map(section => {
          const sense = section.sense;
          const options = [
            ...SENSE_CHIPS[sense],
            ...(section.escapeChip ? [section.escapeChip] : []),
          ];
          const isOpen = freeTextOpen[sense];

          return (
            <div key={sense} className="space-y-3">
              <h2 className="text-lg font-semibold">
                <span className="mr-2">{SENSE_ICONS[sense]}</span>
                {section.heading}
              </h2>
              <ChipGrid
                options={options}
                selected={selected[sense]}
                onToggle={value => toggleDescriptor(sense, value, section.escapeChip)}
              />
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-0 text-sm"
                  onClick={() => toggleFreeTextOpen(sense)}
                >
                  {isOpen ? '− Something else' : '+ Something else'}
                </Button>
                {isOpen && (
                  <textarea
                    className={cn(
                      'mt-2 w-full rounded-md border border-border bg-background p-2 text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-blue-600'
                    )}
                    placeholder="Describe anything else you notice..."
                    value={freeTexts[sense]}
                    onChange={e => setFreeText(sense, e.target.value)}
                    rows={2}
                  />
                )}
              </div>
            </div>
          );
        })}

        {showTiming && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">When did you notice it?</h2>
            <ChipGrid
              options={TIMING_CHIPS}
              selected={timing}
              onToggle={toggleTiming}
            />
          </div>
        )}

        {secondaryAction?.hint && (
          <p className="text-xs text-muted-foreground">{secondaryAction.hint}</p>
        )}
      </div>

      <div className="border-t border-border bg-background p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {secondaryAction && (
            <Button
              type="button"
              variant="outline"
              disabled={!continueEnabled}
              onClick={() => secondaryAction.onAction(buildBundle())}
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            type="button"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={!continueEnabled}
            onClick={() => onSubmit(buildBundle())}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
