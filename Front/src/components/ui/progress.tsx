import {cn} from '@/lib/utils';

type ProgressProps = {
  // 0-100, clamped defensively - callers compute this from bytes and a
  // rounding/timing edge case landing just outside the range shouldn't
  // visibly overflow the bar.
  value: number;
  className?: string;
  barClassName?: string;
};

function Progress({value, className, barClassName}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div
        className={cn('h-full rounded-full bg-cyan-400 transition-[width] duration-200 ease-out', barClassName)}
        style={{width: `${clamped}%`}}
      />
    </div>
  );
}

export {Progress};
