import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

export type PillButtonProps = {
  selected: boolean;
  color?: string;
  onClick: () => void;
  children: ReactNode;
};

// A toggle-able colored pill - used for the app's several "pick zero or more
// from a small colored catalog" facets (status/priority/flag filters).
// Extracted from AdvancedSearchFilters so its own filter chips have a
// reusable implementation rather than a private inline one.
export const PillButton = ({selected, color, onClick, children}: PillButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-full border px-2 py-1 text-xs font-medium transition-opacity',
      !color && (selected ? 'border-accent/60 bg-accent/20 text-accent' : 'border-border bg-transparent text-muted-foreground opacity-60'),
    )}
    style={
      color
        ? {
            backgroundColor: `${color}${selected ? '33' : '14'}`,
            borderColor: `${color}${selected ? '66' : '22'}`,
            color,
            opacity: selected ? 1 : 0.6,
          }
        : undefined
    }
  >
    {children}
  </button>
);
