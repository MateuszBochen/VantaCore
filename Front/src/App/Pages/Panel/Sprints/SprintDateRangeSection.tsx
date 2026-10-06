import {Select} from '@/components/ui/select';

const DURATION_PRESETS = [
  {value: '7', label: '1 week'},
  {value: '14', label: '2 weeks'},
  {value: '21', label: '3 weeks'},
  {value: '28', label: '4 weeks'},
];

type SprintDateRangeSectionProps = {
  startDate: string;
  endDate: string;
  onChange: (dates: {startDate: string; endDate: string}) => void;
};

const addDays = (isoDate: string, days: number): string => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

// The compact half of sprint date picking - a duration preset (1/2/3/4
// weeks) that recomputes endDate from startDate, plus the currently-selected
// range as text. The actual picking happens on SprintFormPage's
// CalendarRangePicker (kept as a sibling, not nested here, so the page can
// lay the two out side by side instead of stacked).
const SprintDateRangeSection = ({startDate, endDate, onChange}: SprintDateRangeSectionProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-foreground">Sprint dates</label>
      <p className="text-xs text-muted-foreground">{startDate && endDate ? `${startDate} → ${endDate}` : 'Pick a start date'}</p>
    </div>

    <Select
      value=""
      onValueChange={(days) => {
        if (startDate) {
          onChange({startDate, endDate: addDays(startDate, Number(days))});
        }
      }}
      disabled={!startDate}
      placeholder="Pick a duration preset…"
      options={DURATION_PRESETS}
    />
  </div>
);

export default SprintDateRangeSection;
