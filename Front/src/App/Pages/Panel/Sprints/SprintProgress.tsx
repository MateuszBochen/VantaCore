import {useEffect, useState} from 'react';

export type SprintUnitProgress = {
  unit: string;
  done: number;
  total: number;
};

type SprintProgressProps = {
  progress: SprintUnitProgress[];
  startDate: string;
  endDate: string;
};

// One compact bar per estimate unit - a board can span projects with
// different Project.estimateUnit values, so "8 done / 20 SP" and "3 done /
// 12h" are shown as separate bars rather than combined into one meaningless
// number (same rule as the Sprint ticket picker's estimate summary - see
// memory: project_vantacore_boards_concept).
const SprintProgress = ({progress, startDate, endDate}: SprintProgressProps) => {
  // How far "today" sits within the sprint's own date range, 0-100 - the
  // same single value backs a reference layer drawn UNDER every unit's own
  // SP-done bar (explicit ask 2026-08-07), so it's only visible wherever SP
  // progress is lagging behind the calendar: red peeking out past the cyan
  // fill reads as "behind schedule", no red visible reads as "on pace or
  // ahead". Computed in an effect, not directly during render - Date.now()
  // is an impure read and the render body must stay pure (react-hooks/purity).
  const [timePercent, setTimePercent] = useState(0);

  useEffect(() => {
    // Deferred via setTimeout rather than called synchronously in the effect
    // body - a bare synchronous setState here would fire on every mount
    // regardless, tripping react-hooks/set-state-in-effect (an unconditional
    // synchronous update always costs an extra render pass); same pattern
    // this codebase already uses for time-derived state in
    // TicketWorklogStopwatch.tsx (there via setInterval, here a one-shot).
    const timeout = setTimeout(() => {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      // Clamped to 0-100 so a not-yet-started or already-ended sprint still
      // renders a sane bar instead of a negative/over-100% width.
      setTimePercent(
        Number.isFinite(start) && Number.isFinite(end) && end > start
          ? Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100))
          : 0,
      );
    }, 0);

    return () => clearTimeout(timeout);
  }, [startDate, endDate]);

  if (progress.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {progress.map(({unit, done, total}) => {
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <div key={unit || '(no unit)'} className="flex items-center gap-2">
            <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-red-500/40 transition-[width] duration-300 ease-out"
                style={{width: `${timePercent}%`}}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-cyan-400 transition-[width] duration-300 ease-out"
                style={{width: `${percent}%`}}
              />
            </div>
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              {done}/{total} {unit || '(no unit)'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SprintProgress;
