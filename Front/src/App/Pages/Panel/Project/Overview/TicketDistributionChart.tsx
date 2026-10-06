import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {CHART_TOOLTIP_CONTENT_STYLE, CHART_TOOLTIP_LABEL_STYLE, CHART_TOOLTIP_ITEM_STYLE, CHART_GRID_STROKE, CHART_AXIS_STROKE, CHART_CURSOR} from '@/lib/Chart/chartTheme';

export type DistributionBar = {
  key: string;
  label: string;
  count: number;
  color: string;
};

type TicketDistributionChartProps = {
  title: string;
  bars: DistributionBar[];
};


// Horizontal bar, one bar per real entity (a project's own Status/IssueType/
// Priority) - "compare magnitude" is the job here (how many tickets in each
// bucket), not identity-of-a-series, so this deliberately isn't a donut (see
// dataviz skill: "part-to-whole ... More than ~7 classes -> a table", and a
// bar handles an arbitrary category count better than a pie ever does).
// Color comes from each entity's own real color (project.statuses[].color /
// issueType.color / PRIORITIES[].color) - identity the user already assigned
// in Settings, not a generated categorical palette, so there's nothing here
// for the CVD validator to check that Settings' own color pickers don't
// already need to satisfy on their own.
const TicketDistributionChart = ({title, bars}: TicketDistributionChartProps) => {
  const data = bars.filter((bar) => bar.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>

      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tickets yet.</p>
      ) : (
        <div style={{height: Math.max(data.length * 32, 64)}} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{top: 4, right: 24, left: 0, bottom: 4}}>
              <CartesianGrid horizontal={false} stroke={CHART_GRID_STROKE} />
              <XAxis type="number" allowDecimals={false} stroke={CHART_AXIS_STROKE} fontSize={11} />
              <YAxis type="category" dataKey="label" width={120} stroke={CHART_AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} itemStyle={CHART_TOOLTIP_ITEM_STYLE} cursor={CHART_CURSOR} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {data.map((bar) => (
                  <Cell key={bar.key} fill={bar.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TicketDistributionChart;
