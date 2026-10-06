import {Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {CHART_TOOLTIP_CONTENT_STYLE, CHART_TOOLTIP_LABEL_STYLE, CHART_TOOLTIP_ITEM_STYLE, CHART_GRID_STROKE, CHART_AXIS_STROKE, CHART_CURSOR} from '@/lib/Chart/chartTheme';

type EstimateVsLoggedChartProps = {
  // Project.estimateUnit - a free-text per-project label (SP, h, days, ...),
  // never converted/validated anywhere else in this app (see that field's
  // own comment on Project). Worklog is always logged in minutes though
  // (see WorklogEntry.minutes) - the two numbers below are NOT necessarily
  // the same unit of measurement, so this can't honestly be one shared axis
  // the way SprintVelocityChart's committed/completed (both the same
  // estimate unit) can be. Each bar keeps its own unit suffix instead of
  // implying an exact 1:1 comparison.
  estimateUnit: string;
  estimated: number;
  loggedHours: number;
};

// Same committed/completed role colors as SprintVelocityChart/
// SprintBurndownChart - "estimated" is the plan (committed's blue),
// "logged" is what actually happened (completed's aqua) - reusing the same
// pair keeps this dashboard visually consistent with the Sprint charts
// instead of introducing a third color pairing for the same semantic role.
const COLOR_ESTIMATED = '#3987e5';
const COLOR_LOGGED = '#199e70';


const EstimateVsLoggedChart = ({estimateUnit, estimated, loggedHours}: EstimateVsLoggedChartProps) => {
  const unitLabel = estimateUnit || 'units';

  const data = [
    {key: 'estimated', label: 'Estimated', value: estimated, fill: COLOR_ESTIMATED},
    {key: 'logged', label: 'Logged', value: Math.round(loggedHours * 10) / 10, fill: COLOR_LOGGED},
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Estimate vs logged</p>

      {estimated === 0 && loggedHours === 0 ? (
        <p className="text-xs text-muted-foreground">No estimates or worklog yet.</p>
      ) : (
        <>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{top: 4, right: 32, left: 0, bottom: 4}}>
                <CartesianGrid horizontal={false} stroke={CHART_GRID_STROKE} />
                <XAxis type="number" allowDecimals={false} stroke={CHART_AXIS_STROKE} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={70}
                  stroke={CHART_AXIS_STROKE}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} itemStyle={CHART_TOOLTIP_ITEM_STYLE} cursor={CHART_CURSOR} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {data.map((row) => (
                    <Cell key={row.key} fill={row.fill} />
                  ))}
                  <LabelList dataKey="value" position="right" fill="var(--muted-foreground)" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Estimated in {unitLabel}, logged in hours{unitLabel.toLowerCase() !== 'h' && unitLabel.toLowerCase() !== 'hours' ? ' — not the same unit' : ''}.
          </p>
        </>
      )}
    </div>
  );
};

export default EstimateVsLoggedChart;
