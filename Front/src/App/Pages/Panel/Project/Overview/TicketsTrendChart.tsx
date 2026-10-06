import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {CHART_TOOLTIP_CONTENT_STYLE, CHART_TOOLTIP_LABEL_STYLE, CHART_TOOLTIP_ITEM_STYLE, CHART_GRID_STROKE, CHART_AXIS_STROKE} from '@/lib/Chart/chartTheme';
import type {ProjectWeekCount} from '@/lib/Project/Stats/Type/types';

type TicketsTrendChartProps = {
  created: ProjectWeekCount[];
  done: ProjectWeekCount[];
};

// Same committed-blue / completed-green pair as SprintVelocityChart, so
// "new work" vs "finished work" reads the same across the app. Validated
// with the dataviz palette checker on every theme surface: passes on
// neon-blaster/dark; on the light theme both sit just under 3:1 against
// the surface, and tritan separation is low - which is why the legend
// below spells out each series' name AND total in text colors instead of
// leaning on the line color alone.
const SERIES = [
  {key: 'created', name: 'Created', color: '#3987e5'},
  {key: 'done', name: 'Done', color: '#199e70'},
] as const;

const formatWeekLabel = (isoDate: string): string => {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
};

// Buckets come pre-computed from the backend (ProjectStats.createdPerWeek/
// donePerWeek) - counting this project-wide belongs in a database GROUP BY,
// not a client-side loop over every ticket. Both series share the same
// weeks; `done` is matched by weekStart rather than by index anyway, so a
// missing bucket reads as 0 instead of shifting the whole line.
const TicketsTrendChart = ({created, done}: TicketsTrendChartProps) => {
  const doneByWeek = new Map(done.map((point) => [point.weekStart, point.count]));
  const data = created.map((point) => ({
    label: formatWeekLabel(point.weekStart),
    created: point.count,
    done: doneByWeek.get(point.weekStart) ?? 0,
  }));
  const totals = {
    created: data.reduce((sum, row) => sum + row.created, 0),
    done: data.reduce((sum, row) => sum + row.done, 0),
  };
  const hasAny = totals.created > 0 || totals.done > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Created vs done</p>

        {hasAny && (
          // The legend - swatch for identity, name + window total in text
          // colors (never the series color) so it stays readable on every
          // theme and doesn't depend on telling the two lines apart by hue.
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {SERIES.map((series) => (
              <span key={series.key} className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full" style={{backgroundColor: series.color}} aria-hidden />
                {series.name} <span className="font-medium text-foreground">{totals[series.key]}</span>
              </span>
            ))}
            {/* Window length is the backend's call (one bucket per week) -
                derived from the data, not hardcoded, so it can't drift. */}
            <span>· last {data.length} weeks</span>
          </div>
        )}
      </div>

      {!hasAny ? (
        <p className="text-xs text-muted-foreground">No tickets created or finished in this window.</p>
      ) : (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{top: 8, right: 8, left: 0, bottom: 0}}>
              <CartesianGrid vertical={false} stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="label" stroke={CHART_AXIS_STROKE} fontSize={11} tickLine={false} />
              <YAxis allowDecimals={false} stroke={CHART_AXIS_STROKE} fontSize={11} width={28} />
              <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} itemStyle={CHART_TOOLTIP_ITEM_STYLE} />
              {SERIES.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.color}
                  strokeWidth={2}
                  fill={series.color}
                  fillOpacity={0.1}
                  activeDot={{r: 4, strokeWidth: 2, stroke: 'var(--popover)'}}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TicketsTrendChart;
