import type {CollectionResponse} from '@/lib/Request/Type/types';

// See memory: project_vantacore_boards_concept - cross-project Kanban board.
// POST/GET (list + single) confirmed 2026-08-05 - update/delete aren't yet,
// those hooks still stub with console.log.

export type BoardSummary = {
  id: string;
  name: string;
};

// Statuses are arbitrary - any status from any issue type of any project
// linked to the board, manually picked by the user (not auto-inferred).
export type BoardColumn = {
  id: string;
  name: string;
  color: string;
  statusIds: string[];
};

export type Board = {
  id: string;
  name: string;
  // Which projects feed tickets into this board.
  projectIds: string[];
  // Order = display order.
  columns: BoardColumn[];
  // Board-level policy, shared by every Sprint under this board (not
  // per-sprint) - whether a ticket's own fields / its estimate specifically
  // can still be edited while it's part of the currently *active* sprint.
  // The Sprint resource itself (id, date range, future/active/closed
  // status, ticketIds) doesn't exist yet - see memory:
  // project_vantacore_boards_concept.
  allowEditTicketInActiveSprint: boolean;
  allowChangeEstimateInActiveSprint: boolean;
  // Scope-creep guards: whether tickets can be added to / pulled out of the
  // active sprint after it's already started, instead of only during
  // planning (while the sprint is still `future`).
  allowAddTicketToActiveSprint: boolean;
  allowRemoveTicketFromActiveSprint: boolean;
};

export type ListBoardsResponseItem = {
  id: string;
  resource: BoardSummary;
};

export type ListBoardsResponse = CollectionResponse<ListBoardsResponseItem>;

export type ListBoardsResult =
  | {success: true; boards: BoardSummary[]}
  | {success: false};

export type GetBoardResponse = {
  id: string;
  type: string;
  resource: Board;
};

export type GetBoardResult =
  | {success: true; board: Board}
  | {success: false};

export type SaveBoardResult =
  | {success: true}
  | {success: false};
