import type {CollectionResponse} from '@/lib/Request/Type/types';

// Flat, chronological - no parentCommentId/threading. "Replying to someone"
// is left to an `@DisplayName` text convention instead of a nested data
// model. Fetched separately via GET .../ticket/:ticketId/comment, not
// embedded on Ticket - same lazy-load precedent as SubProject docs/Worklog.
// `authorId` is resolved to a display name via useUsersHook wherever this
// renders (same convention as WorklogEntry.actorId). `changedAt` differs
// from createdAt once a comment's been edited.
//
// Two different wire shapes carry this per confirmed real payloads
// (2026-08-04): the COMMENT_ADDED websocket message uses a flat authorId,
// but GET .../comment's REST resource nests it as `actor: {id}` - same
// convention as WorklogEntry's actor. useListCommentsHook checks both.
export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  changedAt: string;
};

export type CommentResponseItem = {
  id: string;
  resource: {
    id: string;
    body: string;
    createdAt: string;
    changedAt: string;
    authorId?: string;
    author?: {id: string};
    actor?: {id: string};
  };
};

// Same {meta, data: [{id, resource}]} envelope as ListTicketsResponse/
// ListWorklogResponse - not confirmed for this endpoint specifically yet,
// assumed consistent with those two.
export type ListCommentsResponse = CollectionResponse<CommentResponseItem>;

export type ListCommentsResult =
  | {success: true; comments: Comment[]}
  | {success: false};

export type CommentMutationResult =
  | {success: true}
  | {success: false};

// One logged worklog session - fetched separately via
// GET .../ticket/:ticketId/worklog, not embedded on Ticket (its own history
// table server-side, same lazy-load precedent as Comments/SubProject docs).
// The wire shape's `actor` only carries an id - actorId is resolved to a
// display name via useUsersHook wherever this renders.
export type WorklogEntry = {
  id: string;
  minutes: number;
  // Zoneless local datetime string (was date-only) - see MyWorklogEntry's
  // own comment (wire key stays `date`, see WorklogEntryResponseItem below).
  dateTime: string;
  note: string;
  actorId: string;
};

export type WorklogEntryResponseItem = {
  id: string;
  resource: {
    id: string;
    minutes: number;
    // Wire field name confirmed against the Api project's WorklogResult
    // record - stayed `date` even though the Java type moved from LocalDate
    // to LocalDateTime.
    date: string;
    note: string;
    actor: {id: string};
  };
};

// Same {meta, data: [{id, resource}]} envelope as ListTicketsResponse.
export type ListWorklogResponse = CollectionResponse<WorklogEntryResponseItem>;

export type ListWorklogResult =
  | {success: true; entries: WorklogEntry[]}
  | {success: false};

export type WorklogMutationResult =
  | {success: true}
  | {success: false};

// Fixed across every project (unlike Flags, which are a per-project
// vocabulary) so priority sorts/groups consistently on the future
// Sprints/board module, which spans projects.
export type PriorityLevel = 0 | 1 | 2 | 3 | 4;

export type PriorityDefinition = {
  level: PriorityLevel;
  name: string;
  color: string;
};

// Ordered highest (0) to lowest (4) - render in this order wherever priority
// is listed or picked.
export const PRIORITIES: PriorityDefinition[] = [
  {level: 0, name: 'Highest', color: '#f87171'},
  {level: 1, name: 'High', color: '#fb923c'},
  {level: 2, name: 'Medium', color: '#facc15'},
  {level: 3, name: 'Low', color: '#4ade80'},
  {level: 4, name: 'Lowest', color: '#60a5fa'},
];

// Confirmed 2026-08-04 (was 'not-run' | 'pass' | 'fail').
export type TestCaseStatus = 'not-run' | 'passed' | 'failed' | 'blocked';

// Ad-hoc per ticket, not a reusable per-project library. Fetched separately
// via GET .../ticket/:ticketId/testcase, not embedded on Ticket - same
// lazy-load precedent as Comments/Worklog. createdAt/authorId are only
// present once persisted (a freshly-added-but-not-yet-submitted test case
// has neither, see TicketTestCasesSection).
export type TestCase = {
  id: string;
  title: string;
  steps: string[];
  expectedResult: string;
  status: TestCaseStatus;
  createdAt?: string;
  authorId?: string;
};

export type TestCaseResponseItem = {
  id: string;
  resource: {
    id: string;
    title: string;
    steps: string[];
    expectedResult: string;
    status: string;
    createdAt: string;
    author: {id: string};
  };
};

// Same {meta, data: [{id, resource}]} envelope as ListTicketsResponse/
// ListWorklogResponse/ListCommentsResponse.
export type ListTestCasesResponse = CollectionResponse<TestCaseResponseItem>;

export type ListTestCasesResult =
  | {success: true; testCases: TestCase[]}
  | {success: false};

export type TestCaseMutationResult =
  | {success: true}
  | {success: false};

// Confirmed on GET .../ticket/:ticketId 2026-08-19: nested, not a bare
// sprintId - `sprintName` rides along so callers (TicketFieldsSidebar) don't
// need a separate sprint fetch just to label the current selection. Assumed
// (matching every other nested ref on Ticket, e.g. WorklogEntry.actor) that
// PUT accepts this same shape back rather than a flat id.
export type TicketSprintRef = {
  id: string;
  sprintName: string;
};

// Jira-style typed ticket links (2026-08-20 redesign of the old flat,
// untyped relatedTicketIds: string[]) - each value already encodes the
// relationship from THIS ticket's own point of view, so the frontend never
// computes/flips a direction itself. RELATES_TO is symmetric (same value on
// both sides); the rest are directional pairs. Backend materializes the
// inverse automatically (e.g. this ticket sending BLOCKS against ticket X
// makes X's own GET come back with an IS_BLOCKED_BY entry against this
// ticket) - deliberately NOT modeled as parent/child (that's the existing
// hierarchy field, parentId) or as a generic freeform type, to keep the
// picker's dropdown short and each pair's semantics unambiguous.
export type TicketRelationType = 'BLOCKS' | 'IS_BLOCKED_BY' | 'RELATES_TO' | 'DUPLICATES' | 'IS_DUPLICATED_BY' | 'IMPACTS' | 'IS_IMPACTED_BY';

// key/title/projectId are denormalized (same reasoning as TicketSprintRef's
// sprintName) so TicketRelatedSection can render every row immediately
// instead of firing one getTicket call per related ticket, like the old
// implementation did.
export type TicketRelation = {
  ticketId: string;
  type: TicketRelationType;
  key: string;
  title: string;
  projectId: string;
};

export type Ticket = {
  id: string;
  key: string;
  // Server-assigned on create (confirmed 2026-08-04, same as `key`) - the
  // ticket's creator, shown read-only next to Assignees (see
  // TicketFieldsSidebar), never picked/edited client-side.
  authorId: string;
  projectId: string;
  // Optional - a ticket can exist without one (ad-hoc/manual tickets).
  subProjectId: string | null;
  // Optional (a ticket can exist without being in any sprint) - see TicketSprintRef.
  sprint: TicketSprintRef | null;
  issueTypeId: string;
  statusId: string;
  parentId: string | null;
  title: string;
  description: string;
  priority: PriorityLevel;
  // Only meaningful (and only shown - see TicketFieldsSidebar) when the
  // ticket's issue type has IssueType.estimable set; unit is a free-text
  // per-project label (Project.estimateUnit), not enforced/converted here.
  estimate: number | null;
  assigneeIds: string[];
  flagIds: string[];
  tags: string[];
  customFields: Record<string, unknown>;
  relatedTickets: TicketRelation[];
  // Rollups maintained server-side, not derived client-side: timeSpent is
  // this ticket's own logged time, timeSpentAll also includes every
  // descendant's - every worklog POST/PUT/DELETE updates both, all the way
  // up to the root ticket (see WorklogEntry).
  timeSpent: number;
  timeSpentAll: number;
  // Same rollup shape as timeSpent/timeSpentAll, but for Estimate - seen
  // confirmed 2026-08-05 on the ticket list endpoint's resource; assumed
  // (not yet independently confirmed) to also be on this single-ticket GET,
  // since it's the same rollup concept as timeSpentAll.
  estimateAll: number | null;
  // 0-100, supplied by a future rollup module - the frontend only renders
  // this, it does not compute the hierarchy rollup itself.
  progress: number | null;
  // Direct children only, not a descendant-count rollup - same scope/meaning
  // as TicketSummary.childCount (confirmed 2026-08-13: fullMode search hits
  // are the exact same GetTicketResult object this single-ticket GET
  // returns, via the shared TicketResultAssembler backend-side).
  childCount: number;
  // Same TicketResultAssembler as childCount above - assumed present here
  // too (not yet independently confirmed on this specific single-ticket
  // response), since it's the same underlying resource object the list
  // endpoint's TicketListResource already confirmed it on.
  createdAt: string;
};

// A single past version of a ticket's own editable fields, from
// GET .../ticket/:ticketId/history?before=... (same mechanism as
// SubProjectVersion/useGetSubProjectHistoryHook: `before` is exclusive, the
// backend returns the single most recent version strictly older than it).
// Deliberately NOT `Ticket & {...}` like SubProjectVersion is - unlike a
// sub-project, a ticket has fields that aren't part of its edit history at
// all (id/key/authorId/projectId are constant identity, timeSpent/
// timeSpentAll/progress are rollups computed from other resources), so this
// only carries what a version snapshot actually has.
export type TicketVersion = {
  versionId: string;
  ticketId: string;
  subProjectId: string | null;
  issueTypeId: string;
  statusId: string;
  parentId: string | null;
  title: string;
  description: string;
  priority: PriorityLevel;
  estimate: number | null;
  assigneeIds: string[];
  flagIds: string[];
  tags: string[];
  customFields: Record<string, unknown>;
  relatedTickets: TicketRelation[];
  changedByUserId: string;
  changedByEmail: string;
  changedAt: string;
};

export type TicketHistoryResource = {
  id: string;
  ticketId: string;
  subProjectId: string | null;
  issueTypeId: string;
  statusId: string;
  parentId: string | null;
  title: string;
  description: string;
  priority: PriorityLevel;
  estimate: number | null;
  assigneeIds: string[];
  flagIds: string[];
  tags: string[];
  customFields: Record<string, unknown>;
  relatedTickets: TicketRelation[];
  changedByUserId: string;
  changedByEmail: string;
  changedAt: string;
};

export type GetTicketHistoryResponse = {
  id: string;
  type: string;
  resource: TicketHistoryResource;
};

export type GetTicketHistoryResult =
  | {success: true; version: TicketVersion}
  | {success: false};

// Lightweight shape for the ticket list/tree - just the fields TicketRow
// actually renders, picked out of the endpoint's much larger resource (see
// TicketListResource) rather than carrying the whole thing around.
export type TicketSummary = {
  id: string;
  key: string;
  title: string;
  // Every field on TicketListResource is already on the wire for this same
  // endpoint (see that type's own comment) - carried through here too so
  // callers like MyTicketsPage don't need a second, heavier fetch just to
  // read assigneeIds/projectId.
  projectId: string;
  assigneeIds: string[];
  issueTypeId: string;
  statusId: string;
  // Needed to walk up to a ticket's root ancestor (e.g. for a Board's rail
  // rendering, or a Sprint's ticket picker) without fetching the full Ticket.
  parentId: string | null;
  priority: PriorityLevel;
  progress: number | null;
  timeSpentAll: number;
  estimateAll: number | null;
  // This ticket's own estimate (not the rollup) - e.g. a Sprint's planned-
  // estimate total sums *this*, not estimateAll, so a ticket's estimate
  // isn't double-counted once for itself and again via a selected child.
  estimate: number | null;
  // Direct children only (not a descendant-count rollup) - lets TicketRow
  // hide its expand chevron for leaf tickets instead of offering to expand
  // into an empty list.
  childCount: number;
  // Confirmed on the wire (2026-08-13, same live payload as everything else
  // here) - just wasn't picked out until SprintTicketPickerRow needed it.
  tags: string[];
  // Confirmed on the wire (2026-08-25, same live payload as everything else
  // here) - flagIds already existed on TicketListResource but wasn't picked
  // out until the Project Overview dashboard's "at risk" widget needed it;
  // createdAt didn't exist on this endpoint's response at all until the
  // dashboard's trend chart needed it (backend added it for that reason).
  flagIds: string[];
  createdAt: string;
};

// The list endpoint's resource, confirmed 2026-08-05 - despite "list", this
// is basically a full ticket snapshot (same fields as Ticket, plus
// estimateAll) rather than a trimmed-down summary; `testCases` on the wire
// is ignored since that's its own endpoint now, not part of Ticket anymore.
export type TicketListResource = {
  id: string;
  key: string;
  authorId: string;
  projectId: string;
  subProjectId: string | null;
  issueTypeId: string;
  statusId: string;
  parentId: string | null;
  title: string;
  description: string;
  priority: PriorityLevel;
  estimate: number | null;
  assigneeIds: string[];
  flagIds: string[];
  tags: string[];
  customFields: Record<string, unknown>;
  relatedTickets: TicketRelation[];
  timeSpent: number;
  timeSpentAll: number;
  estimateAll: number | null;
  progress: number | null;
  childCount: number;
  createdAt: string;
};

export type ListTicketsResponseItem = {
  id: string;
  resource: TicketListResource;
};

// page is 0-indexed, limit defaults to 25 server-side when omitted.
export type ListTicketsResponse = CollectionResponse<ListTicketsResponseItem>;

// total = meta.total, across every page (the endpoint pages - 25 per page
// unless a limit is passed, see useGetTicketsHook).
export type ListTicketsResult =
  | {success: true; tickets: TicketSummary[]; total: number}
  | {success: false};

export type GetTicketResponse = {
  id: string;
  type: string;
  resource: Ticket;
};

export type GetTicketResult =
  | {success: true; ticket: Ticket}
  | {success: false};

export type SaveTicketResult =
  | {success: true}
  | {success: false};

// GET .../ticket/tags - every distinct tag already used somewhere in this
// project, for tag-field autocomplete (TicketFieldsSidebar). `resource` is a
// bare string array, not a {id, resource} record like every other endpoint
// here - this one has no single "thing" it's describing, just a vocabulary.
export type GetTicketTagsResponse = {
  id: string;
  type: string;
  resource: string[];
};

export type GetTicketTagsResult =
  | {success: true; tags: string[]}
  | {success: false};

// POST .../ticket/bulk - Bulk Operations sub-project. Deliberately re-uses
// each ticket's own validation rules server-side (looped per-ticket, not a
// separate relaxed "bulk mode") - see that sub-project's ADR - so a partial
// failure is expected and normal, not exceptional: `results` reports one
// entry per requested ticket, success or not, instead of the whole call
// failing on the first bad one. DELETE has no backing endpoint yet at all
// (no single-ticket delete exists in this app either) - included here since
// the Bulk Operations Solution Design already committed to it, but it can't
// actually work until that's built.
export type TicketBulkActionType = 'SET_STATUS' | 'ASSIGN' | 'SET_FIELD' | 'ADD_FLAG' | 'REMOVE_FLAG' | 'MOVE_SUB_PROJECT' | 'DELETE';

export type TicketBulkAction = {
  type: TicketBulkActionType;
  params: Record<string, string>;
};

export type TicketBulkActionResult = {
  ticketId: string;
  success: boolean;
  error: string | null;
};

export type BulkUpdateTicketsResult =
  | {success: true; results: TicketBulkActionResult[]}
  | {success: false; message: string};
