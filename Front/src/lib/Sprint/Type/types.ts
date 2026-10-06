import type {CollectionResponse} from '@/lib/Request/Type/types';

// See memory: project_vantacore_boards_concept - Sprint sub-resource, one
// board can have several. Endpoints confirmed 2026-08-05: PUT (save,
// upsert), GET (list), POST .../start, POST .../close.

export type SprintStatus = 'future' | 'active' | 'closed';

export type SprintReportEntry = {
  ticketId: string;
  statusId: string;
  timeSpent: number;
};

// Which project a sprint ticket belongs to - carried alongside the ticket id
// itself (not guessed) since tickets don't move across projects, so this
// same projectId is also correct for that ticket's ancestors when a rail
// walks up to the root (see useSprintRail). Replaced a bare `ticketIds:
// string[]` (2026-08-10) that forced the frontend to guess a ticket's
// project by trying every board-linked project until one didn't 404.
export type SprintTicketRef = {
  ticketId: string;
  projectId: string;
};

// Server-computed estimate total for one unit - a board can span projects
// with different estimateUnits, so this is always a breakdown array, never
// one combined number (same reasoning as SprintProgress.tsx's own
// client-computed SprintUnitProgress, which sums live from `tickets`
// instead - these three fields are the server's own snapshot/rollup,
// confirmed on GET (list) 2026-08-11).
export type SprintEstimateByUnit = {
  unit: string;
  value: number;
};

export type Sprint = {
  id: string;
  boardId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  // Any ticket, not just roots (unlike a Board's rail, which is always
  // keyed by the root ancestor) - the frontend derives ancestor context for
  // display, this only holds what's actually "in" the sprint.
  tickets: SprintTicketRef[];
  // Server-managed - set by the start/close actions, never written by the
  // save (PUT) endpoint.
  startedAt: string | null;
  startedByUserId: string | null;
  closedAt: string | null;
  closedByUserId: string | null;
  report: SprintReportEntry[];
  // Planned estimate total when the sprint was started.
  initialEstimateUnit: SprintEstimateByUnit[];
  // Estimate total still in the sprint when it was closed (reflects any
  // scope added/removed mid-sprint, unlike initialEstimateUnit).
  closingEstimateUnit: SprintEstimateByUnit[];
  // Actual completed estimate total.
  actualEstimateUnit: SprintEstimateByUnit[];
};

// The PUT body only accepts these four fields - status/startedAt/report/etc
// are all server-derived (via start/close and worklog), never client-writable.
export type SaveSprintPayload = {
  name: string;
  startDate: string;
  endDate: string;
  tickets: SprintTicketRef[];
};

export type ListSprintsResponseItem = {id: string; resource: Sprint};

export type ListSprintsResponse = CollectionResponse<ListSprintsResponseItem>;

export type ListSprintsQuery = {
  from?: string;
  till?: string;
};

export type ListSprintsResult =
  | {success: true; sprints: Sprint[]}
  | {success: false};

export type SaveSprintResult =
  | {success: true}
  | {success: false};

export type SprintActionResult =
  | {success: true}
  | {success: false};

// Same 422 shape as SaveProjectErrorResponse/CreateUserErrorResponse -
// start/close return a single validation notification (e.g.
// "missing-estimate-unit") this way rather than a generic failure, so the
// toast can show the real reason.
export type SprintActionErrorItem = {
  id: string;
  resource: {
    code: string;
    message: string;
    isBlocked: boolean;
  };
};

export type SprintActionErrorResponse = CollectionResponse<SprintActionErrorItem>;

// GET /api/board/{boardId}/sprint/{sprintId}/report - ticketStatusTransitions
// confirmed 2026-08-11 (see SprintSummaryPage); burndownByUnit PROPOSED,
// folded into this same endpoint rather than a separate one (2026-08-11) -
// both need the same underlying work (scanning each sprint ticket's history
// within the sprint's window), so one endpoint/one request covers both
// instead of two near-identical round trips.
//
// ticketStatusTransitions: per-ticket count of statusId changes whose
// changedAt falls within the sprint's own window (startedAt -> closedAt, or
// "now" while still active).
//
// burndownByUnit: for each estimate unit, how much was actually remaining
// at the end of each day of the sprint. Neither is computable client-side -
// both need to know, for every ticket, the exact date(s) its statusId
// changed, which would mean walking every ticket's full history one
// snapshot at a time (see useGetTicketHistoryHook) - the N-sequential-
// requests problem this endpoint exists to avoid. The burndown's "ideal"
// line doesn't need any of this though - it's a straight line from
// initialEstimateUnit down to 0 across startDate -> endDate, computed
// client-side (see SprintBurndownChart).
export type SprintTicketTransitionCount = {
  ticketId: string;
  count: number;
};

export type SprintBurndownPoint = {
  date: string;
  remaining: number;
};

export type SprintBurndownUnit = {
  unit: string;
  points: SprintBurndownPoint[];
};

export type SprintReport = {
  sprintId: string;
  ticketStatusTransitions: SprintTicketTransitionCount[];
  burndownByUnit: SprintBurndownUnit[];
};

export type GetSprintReportResponse = {
  id: string;
  type: string;
  resource: SprintReport;
};

export type GetSprintReportResult =
  | {success: true; report: SprintReport}
  | {success: false};
