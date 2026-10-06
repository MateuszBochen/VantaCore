import {cn} from '@/lib/utils';

export type TriStateValue = boolean | null;

export type TriStateSwitchProps = {
  value: TriStateValue;
  onChange: (value: TriStateValue) => void;
  trueLabel?: string;
  nullLabel?: string;
  falseLabel?: string;
  disabled?: boolean;
  className?: string;
};

// Order matters - the thumb's position is this array's index.
const OPTIONS: {value: TriStateValue; thumbClassName: string; activeTextClassName: string}[] = [
  {value: true, thumbClassName: 'bg-accent shadow-[0_0_10px] shadow-accent/50', activeTextClassName: 'text-black'},
  {value: null, thumbClassName: 'bg-muted', activeTextClassName: 'text-foreground'},
  {value: false, thumbClassName: 'bg-destructive shadow-[0_0_10px] shadow-destructive/50', activeTextClassName: 'text-white'},
];

// Segmented yes / unset / no control for nullable booleans - null is a real
// third state ("not decided" / "any"), not just a missing value, so it gets
// its own segment instead of being inferred from neither side being picked.
// A single thumb slides between the three equal-width segments (grid-cols-3,
// so translateX(index * 100%) lands exactly on each one) and cross-fades its
// color, rather than each segment toggling its own background.
function TriStateSwitch({
  value,
  onChange,
  trueLabel = 'Yes',
  nullLabel = '—',
  falseLabel = 'No',
  disabled,
  className,
}: TriStateSwitchProps) {
  const labels = [trueLabel, nullLabel, falseLabel];
  const activeIndex = OPTIONS.findIndex((option) => option.value === value);
  const active = OPTIONS[activeIndex];

  return (
    <div
      role="radiogroup"
      className={cn(
        // --input-background/--input-border, same reasoning as Input/Select/Checkbox.
        'relative inline-grid h-8 w-fit grid-cols-3 items-center rounded-md border border-(--input-border) bg-(--input-background) p-0.5',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0.5 left-0.5 w-[calc((100%-0.25rem)/3)] rounded',
          'transition-[translate,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
          active.thumbClassName,
        )}
        style={{translate: `${activeIndex * 100}% 0`}}
      />

      {OPTIONS.map((option, index) => {
        const selected = index === activeIndex;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 h-full min-w-10 rounded px-2 text-xs font-medium outline-none transition-[color,scale] duration-200 active:scale-90',
              'focus-visible:ring-3 focus-visible:ring-ring/50',
              selected ? option.activeTextClassName : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {labels[index]}
          </button>
        );
      })}
    </div>
  );
}

export {TriStateSwitch};
