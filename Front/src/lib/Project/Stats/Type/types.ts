// Backend-aggregated project-wide stats (Project Overview dashboard) - a
// single GROUP BY-shaped query server-side instead of the frontend pulling
// every ticket down to count them client-side. That approach (paginating
// through the full TicketListResource - description/customFields/
// relatedTickets/testCases and all - just to tally statusId/priority/
// issueTypeId) works for a demo project but falls over for real ones: a
// 10,000-ticket project would mean megabytes of unused JSON transferred and
// counted in JS on every page load, and the earlier MAX_TICKET_PAGES
// backstop meant stats silently went inaccurate past a hard-coded cap. This
// endpoint counts ALL tickets in the project (root + descendants, not just
// roots like the ticket tree view scopes to) - a true project-wide picture,
// not the tree-navigation scope TicketsPage/getTickets needs for its own
// different purpose.
export type ProjectStatusCount = {
  statusId: string;
  count: number;
};

export type ProjectIssueTypeCount = {
  issueTypeId: string;
  count: number;
};

export type ProjectPriorityCount = {
  priority: number;
  count: number;
};

// One weekly bucket of the "created vs done" trend - backend buckets by
// week itself (see ProjectOverview's own prior client-side bucketing, now
// removed) rather than shipping every ticket's raw timestamps down just to
// group them in the browser. Same shape for both series.
export type ProjectWeekCount = {
  weekStart: string;
  count: number;
};

export type ProjectStats = {
  ticketsTotal: number;
  ticketsDone: number;
  ticketsFlagged: number;
  byStatus: ProjectStatusCount[];
  byIssueType: ProjectIssueTypeCount[];
  byPriority: ProjectPriorityCount[];
  // Sums of ROOT tickets' own estimateAll/timeSpentAll rollups (already
  // include every descendant - see Ticket.timeSpentAll's own comment) - NOT
  // a sum of every individual ticket's own estimate/timeSpent, which would
  // double-count a child's work once for itself and again via its parent's
  // rollup.
  estimateTotal: number;
  loggedMinutesTotal: number;
  createdPerWeek: ProjectWeekCount[];
  // Same weeks as createdPerWeek (same generate_series on the backend),
  // counted by tickets.done_at - when a ticket entered a done status; it's
  // cleared again on reopen, so this counts tickets that are done now, by
  // the week they got there.
  donePerWeek: ProjectWeekCount[];
};

export type GetProjectStatsResponse = {
  id: string;
  type: string;
  resource: ProjectStats;
};

export type GetProjectStatsResult = {success: true; stats: ProjectStats} | {success: false};
