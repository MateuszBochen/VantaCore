import {useMemo} from 'react';
import {Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import type {SprintBurndownPoint} from '@/lib/Sprint/Type/types';
import {CHART_TOOLTIP_CONTENT_STYLE, CHART_TOOLTIP_LABEL_STYLE, CHART_GRID_STROKE, CHART_AXIS_STROKE, CHART_AXIS_LINE, CHART_LEGEND_STYLE} from '@/lib/Chart/chartTheme';

export type SprintBurndownChartProps = {
  unit: string;
  startDate: string;
  endDate: string;
  // This unit's initialEstimateUnit value - the ideal line's starting point.
  committed: number;
  // May be empty (see useGetSprintReportHook's burndownByUnit - not yet
  // available from the backend) - the ideal line still draws either way.
  actualPoints: SprintBurndownPoint[];
};

// Same "committed"/"completed" role colors as SprintVelocityChart - ideal
// (the target/reference line) reuses the "committed" blue, actual reuses
// the "completed" aqua.
const COLOR_IDEAL = '#3987e5';
const COLOR_ACTUAL = '#199e70';


const addDays = (isoDate: string, days: number): string => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const daysBetween = (start: string, end: string): number =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

const isWeekend = (isoDate: string): boolean => {
  const day = new Date(isoDate).getDay();
  return day === 0 || day === 6;
};

type BurndownRow = {
  date: string;
  ideal: number;
  actual: number | null;
};

// Preferred/ideal line (computed client-side: committed -> 0 across the
// sprint's own date range, flat on Saturdays/Sundays - no work is expected
// to land on non-working days, so a naive uniform-per-calendar-day slope
// would read as "falling behind" every single weekend for no real reason)
// vs actual remaining work per day, from sprint start to end, per estimate
// unit (small multiples - never one combined axis across units, a board
// can span projects with different estimateUnits). The actual line only
// draws as far as `actualPoints` has data, so a still-active sprint's line
// just stops at "today" rather than being fabricated forward. Built on
// Recharts (2026-08-11, replacing a hand-rolled SVG version whose text got
// distorted by non-uniform viewBox scaling and had no real axis/scale).
const SprintBurndownChart = ({unit, startDate, endDate, committed, actualPoints}: SprintBurndownChartProps) => {
  const rows = useMemo<BurndownRow[]>(() => {
    const totalDays = Math.max(0, daysBetween(startDate, endDate));
    const dates = Array.from({length: totalDays + 1}, (_, index) => addDays(startDate, index));

    // Day 0 (sprint start) is always full scope, nothing's been done yet -
    // decrements only ever apply to dates[1..] on working days, so the
    // divisor excludes day 0 too. Otherwise, whenever day 0 itself happens
    // to land on a weekday, the line would fall one decrement short of 0 by
    // the sprint's last day instead of landing on it exactly.
    const decrementableDays = dates.slice(1).filter((date) => !isWeekend(date)).length || 1;
    const decrementPerWorkingDay = committed / decrementableDays;

    const actualByDate = new Map(actualPoints.map((point) => [point.date, point.remaining]));

    // Anchor the actual line to the same origin as ideal's day 0 (full
    // committed scope, nothing done yet) - the report endpoint only returns
    // points for days it has an end-of-day snapshot for, which may not
    // include the sprint's own start date yet, leaving the actual line
    // visually disconnected from where ideal begins.
    if (actualByDate.size > 0 && !actualByDate.has(startDate)) {
      actualByDate.set(startDate, committed);
    }

    let remaining = committed;

    return dates.map((date, index) => {
      if (index > 0 && !isWeekend(date)) {
        remaining = Math.max(0, remaining - decrementPerWorkingDay);
      }

      return {date, ideal: Math.round(remaining), actual: actualByDate.get(date) ?? null};
    });
  }, [startDate, endDate, committed, actualPoints]);

  const hasActual = actualPoints.length > 0;

  // Gradient id must be unique per rendered chart, not just per component -
  // burndownByUnit renders one SprintBurndownChart per unit on the same
  // page, and <defs> ids are document-scoped, not scoped to their own <svg>.
  const gradientId = `burndown-actual-fill-${(unit || 'default').replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Burndown · {unit || '(no unit)'}</p>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{top: 8, right: 8, left: 0, bottom: 0}}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_ACTUAL} stopOpacity={0.35} />
                <stop offset="95%" stopColor={COLOR_ACTUAL} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="date" stroke={CHART_AXIS_STROKE} fontSize={10} tickLine={false} axisLine={CHART_AXIS_LINE} minTickGap={24} />
            <YAxis stroke={CHART_AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} />
            <Legend wrapperStyle={CHART_LEGEND_STYLE} formatter={(value) => <span style={{color: 'var(--muted-foreground)'}}>{value}</span>} />
            {hasActual && (
              <Area
                type="linear"
                dataKey="actual"
                name="Actual"
                stroke={COLOR_ACTUAL}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                // Dots (unlike the ideal line, which has a value every day and
                // stays dot-free) - actual data is sparse, especially right
                // after a sprint starts, and a lone point with no adjacent
                // neighbor draws no line segment at all without a dot to mark it.
                dot={{r: 3, strokeWidth: 0, fill: COLOR_ACTUAL}}
                connectNulls={false}
              />
            )}
            {/* Drawn after the actual area so the dashed reference line stays
                visible on top of its fill instead of being washed out under it. */}
            <Line type="linear" dataKey="ideal" name="Ideal" stroke={COLOR_IDEAL} strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!hasActual && <p className="text-xs text-muted-foreground">Actual burndown not available yet.</p>}
    </div>
  );
};

export default SprintBurndownChart;
