// Optional post-release "after care" window planned for a version - how long
// the team expects to actively watch and patch a release after it ships.
// Kept separate from the type itself (same pattern as releaseStatuses) so
// the list of options is a one-line edit. Values are ISO-8601 duration
// strings - a backend-neutral encoding the API can store verbatim; an empty
// string means no after care is planned.
export const AFTER_CARE_PERIODS: {id: string; label: string}[] = [
  {id: 'P1D', label: '1 day'},
  {id: 'P2D', label: '2 days'},
  {id: 'P3D', label: '3 days'},
  {id: 'P4D', label: '4 days'},
  {id: 'P5D', label: '5 days'},
  {id: 'P6D', label: '6 days'},
  {id: 'P1W', label: '1 week'},
  {id: 'P2W', label: '2 weeks'},
  {id: 'P1M', label: '1 month'},
  {id: 'P2M', label: '2 months'},
];

// Approximate calendar length of an after-care period in days, for drawing
// the window on the roadmap timeline. Months are rounded to 30/60 - the
// roadmap grid is day-based and this bar is a visual guide, not a precise
// end date. Anything unrecognized (including '') is 0, i.e. "don't draw it".
export const getAfterCarePeriodDays = (period: string): number => {
  switch (period) {
    case 'P1D':
      return 1;
    case 'P2D':
      return 2;
    case 'P3D':
      return 3;
    case 'P4D':
      return 4;
    case 'P5D':
      return 5;
    case 'P6D':
      return 6;
    case 'P1W':
      return 7;
    case 'P2W':
      return 14;
    case 'P1M':
      return 30;
    case 'P2M':
      return 60;
    default:
      return 0;
  }
};

// Falls back to the raw value rather than hiding it - a period coming back
// from the backend that isn't one of the options above should still be
// visible, same "don't hide unrecognized data" convention as
// getReleaseStatusLabel.
export const getAfterCarePeriodLabel = (period: string): string =>
  AFTER_CARE_PERIODS.find((candidate) => candidate.id === period)?.label ?? period;
