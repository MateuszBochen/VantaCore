package vantaCore.application.ticket.appliaction.query.getProjectStats;

import java.util.List;

/** ticketsTotal/ticketsDone/ticketsFlagged/byStatus/byIssueType/byPriority cover EVERY ticket in
 the project (root + descendants) - unlike GET .../ticket, this isn't scoped by parentId.
 estimateTotal/loggedMinutesTotal are root-tickets-only sums of the already-computed estimateAll/
 timeSpentAll rollups (see GetTicketResult) - summing those same rollups across every ticket instead
 of just roots would double (or worse) count descendant time/estimate. */
public record ProjectStatsResult(
    long ticketsTotal,
    long ticketsDone,
    long ticketsFlagged,
    List<StatusCountResult> byStatus,
    List<IssueTypeCountResult> byIssueType,
    List<PriorityCountResult> byPriority,
    double estimateTotal,
    long loggedMinutesTotal,
    List<CreatedPerWeekResult> createdPerWeek,
    // Same 10 weeks as createdPerWeek, index for index - tickets that became done in that week.
    List<DonePerWeekResult> donePerWeek
) {
}
