import type {Sprint} from '@/lib/Sprint/Type/types';

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const addDays = (isoDate: string, days: number): string => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

// A purely local, unsaved sprint - always starts as 'future' (starting it
// is a separate action, not part of creation, see memory:
// project_vantacore_boards_concept). Defaults to a 2-week duration from
// today - just a starting point, both dates are freely editable.
const createDraftSprint = (boardId: string): Sprint => {
  const startDate = todayIso();

  return {
    id: crypto.randomUUID(),
    boardId,
    name: '',
    startDate,
    endDate: addDays(startDate, 14),
    status: 'future',
    tickets: [],
    startedAt: null,
    startedByUserId: null,
    closedAt: null,
    closedByUserId: null,
    report: [],
    // Server-computed once the sprint actually starts/progresses - nothing
    // to show yet for a draft that hasn't even been saved.
    initialEstimateUnit: [],
    closingEstimateUnit: [],
    actualEstimateUnit: [],
  };
};

export default createDraftSprint;
