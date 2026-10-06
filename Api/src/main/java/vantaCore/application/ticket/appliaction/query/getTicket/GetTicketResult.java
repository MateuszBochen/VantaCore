package vantaCore.application.ticket.appliaction.query.getTicket;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public record GetTicketResult(
    UUID id,
    String key,
    UUID authorId,
    UUID projectId,
    UUID subProjectId,
    UUID issueTypeId,
    UUID statusId,
    UUID parentId,
    String title,
    String description,
    Integer priority,
    double estimate,
    Set<UUID> assigneeIds,
    Set<UUID> flagIds,
    Set<String> tags,
    Map<String, Object> customFields,
    List<TicketRelatedTicketResult> relatedTickets,
    Instant createdAt,
    Instant changedAt,
    // Own worklog time only, vs. own + every descendant's - see PropagateTimeSpentCommandHandler. The individual
    // worklog entries live at GET .../ticket/{id}/worklog, not duplicated here.
    int timeSpent,
    int timeSpentAll,
    // Own estimate + every descendant's - see PropagateEstimateCommandHandler.
    double estimateAll,
    // Not modeled/persisted yet - always empty until its own feature exists.
    List<Object> testCases,
    // Direct children only, not the whole descendant tree.
    int childCount,
    // Recursive, weighted average down the whole subtree (not just direct children) - null for a
    // leaf ticket that isn't done itself. See TicketResultAssembler.computeProgress /
    // PropagateProgressCommandHandler for how a non-leaf ticket's value is kept up to date.
    Integer progress,
    // The ticket's current (non-CLOSED) sprint, across every board - null if it isn't in one.
    TicketSprintResult sprint
) {
}
