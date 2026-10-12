import type { SenseType } from '@/types/symptom';
import { SENSE_ICONS } from '@/data/senseChips';
import { cn } from '@/lib/utils';

interface SymptomPrimerProps {
  onSelect: (sense: SenseType) => void;
  onFallback: () => void;
}

interface SenseCard {
  sense: SenseType;
  label: string;
  hint: string;
}

const CARDS: SenseCard[] = [
  {
    sense: 'HEAR',
    label: 'I hear something',
    hint: 'A noise, rattle, squeal, or knock',
  },
  {
    sense: 'SEE',
    label: 'I see something',
    hint: 'A leak, smoke, damage, or a warning light',
  },
  {
    sense: 'FEEL',
    label: 'It feels different',
    hint: 'Vibration, pulling, or a soft brake pedal',
  },
  {
    sense: 'SMELL',
    label: 'Something smells',
    hint: 'Sweet, burning, fuel, or another odor',
  },
];

export function SymptomPrimer({ onSelect, onFallback }: SymptomPrimerProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">What's going on?</h1>
        <p className="text-sm text-muted-foreground">
          Start with a quick video, or tell us what you notice.
        </p>
      </div>

      <div className="space-y-3">
        {CARDS.map(({ sense, label, hint }) => (
          <button
            key={sense}
            type="button"
            onClick={() => onSelect(sense)}
            className={cn(
              'w-full flex items-center gap-4 rounded-lg border p-4 sm:p-5 text-left',
              'hover:border-blue-600 hover:ring-1 hover:ring-blue-600 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-600'
            )}
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-3xl">
              {SENSE_ICONS[sense]}
            </span>
            <span className="flex flex-col">
              <span className="font-semibold text-lg">{label}</span>
              <span className="text-sm text-muted-foreground">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onFallback}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Can't record it? Answer a few questions instead
        </button>
      </div>
    </div>
  );
}
