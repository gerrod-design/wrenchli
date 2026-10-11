// src/components/symptoms/ChipGrid.tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ChipGridProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function ChipGrid({ options, selected, onToggle }: ChipGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn(
              'rounded-full px-4 py-2 text-sm',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            )}
            variant={isSelected ? 'default' : 'outline'}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}
