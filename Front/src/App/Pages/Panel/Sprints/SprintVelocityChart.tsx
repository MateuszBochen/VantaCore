import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {CHART_TOOLTIP_CONTENT_STYLE, CHART_TOOLTIP_LABEL_STYLE, CHART_GRID_STROKE, CHART_AXIS_STROKE, CHART_AXIS_LINE, CHART_CURSOR, CHART_LEGEND_STYLE} from '@/lib/Chart/chartTheme';

export type SprintVelocityPoint = {
  id: string;
  name: string;
  committed: number;
  completed: number;
};

type SprintVelocityChartProps = {
  unit: string;
  points: SprintVelocityPoint[];
};

// Dataviz skill's default validated categorical palette, dark-surface steps
// (this app has no light mode) - slots 1 (blue) and 3 (aqua), which the
// palette's own docs guarantee validate together (its "first three slots
// validate all-pairs in both modes" note).
const COLOR_COMMITTED = '#3987e5';
const COLOR_COMPLETED = '#199e70';


// Velocity across this board's closed sprints - committed (initial
// estimate) vs completed (actual), one small-multiple chart per estimate
// unit (never combined onto one axis - a board can span projects with
// different units, same rule as SprintProgress.tsx). Built on Recharts
// (2026-08-11, replacing a hand-rolled SVG version whose text got distorted
// by non-uniform viewBox scaling and had no real axis/scale).
const SprintVelocityChart = ({unit, points}: SprintVelocityChartProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Velocity · {unit || '(no unit)'}</p>

      {points.length === 0 ? (
        <p className="text-xs text-muted-foreground">No closed sprints yet on this board.</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{top: 8, right: 8, left: 0, bottom: 0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" stroke={CHART_AXIS_STROKE} fontSize={11} tickLine={false} axisLine={CHART_AXIS_LINE} />
              <YAxis stroke={CHART_AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} cursor={CHART_CURSOR} />
              <Legend wrapperStyle={CHART_LEGEND_STYLE} formatter={(value) => <span style={{color: 'var(--muted-foreground)'}}>{value}</span>} />
              <Bar dataKey="committed" name="Committed" fill={COLOR_COMMITTED} radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill={COLOR_COMPLETED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SprintVelocityChart;
