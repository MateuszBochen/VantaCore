export type SprintAssigneePoint = {
  id: string;
  name: string;
  completed: number;
  incomplete: number;
};

type SprintAssigneeChartProps = {
  points: SprintAssigneePoint[];
};

// Same "completed" role color as SprintBurndownChart's own aqua - the track
// is a lighter step of that SAME hue (not a second categorical color) per
// the dataviz skill's meter spec: "the unfilled track is a lighter step of
// the same ramp, so state reads across the whole bar." This is a single
// ratio per person (done / total), not a 2-series comparison, so a pie (or
// a second hue) would be the wrong tool here - see choosing-a-form.md:
// "single ratio against a limit -> Meter, not a pie of 2 slices."
const COLOR_DONE = '#199e70';
const COLOR_TRACK = 'rgba(25, 158, 112, 0.18)';

const SIZE = 88;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// One radial progress meter per assignee (done vs total, as a ring rather
// than a bar) - small multiples, hand-built SVG per the dataviz skill's own
// "build each piece in plain HTML" guidance rather than spinning up a full
// Recharts RadialBarChart per person.
const SprintAssigneeChart = ({points}: SprintAssigneeChartProps) => {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">No assigned tickets in this sprint.</p>;
  }

  return (
    <div className="flex flex-wrap gap-6">
      {points.map(({id, name, completed, incomplete}) => {
        const total = completed + incomplete;
        const ratio = total > 0 ? completed / total : 0;
        const dashOffset = CIRCUMFERENCE * (1 - ratio);

        return (
          <div key={id} className="flex flex-col items-center gap-2" style={{width: SIZE + 16}}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={COLOR_TRACK} strokeWidth={STROKE} />
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={COLOR_DONE}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill="var(--foreground)">
                {completed}/{total}
              </text>
            </svg>

            <p className="w-full truncate text-center text-xs text-muted-foreground" title={name}>
              {name}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default SprintAssigneeChart;
