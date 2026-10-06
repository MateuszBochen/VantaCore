package vantaCore.ui.http.ws;

import vantaCore.application.ticket.appliaction.query.getTicket.TicketRelatedTicketResult;
import vantaCore.application.ticket.domain.TicketSnapshot;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Wire shape pushed over WebSocket for ticket create/change events - mirrors the full ticket so the
 frontend can merge it straight into its existing Ticket state without reshaping.

 relatedTickets is the same enriched {ticketId, type, key, title, projectId} shape GetTicketResult
 uses (via TicketRelationEnricher) - unlike the other id-only fields here (assigneeIds, flagIds,
 ...), a related ticket isn't a small per-project catalog the frontend can already resolve on its
 own, so the broadcast carries the display fields itself rather than making every listener re-fetch
 just to show a related-tickets panel. */
record TicketBroadcastResult(
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
    Instant changedAt
) {
    static TicketBroadcastResult from(TicketSnapshot snapshot, List<TicketRelatedTicketResult> relatedTickets) {
        return new TicketBroadcastResult(
            snapshot.id().value(),
            snapshot.key().value(),
            snapshot.authorId(),
            snapshot.projectId(),
            snapshot.subProjectId(),
            snapshot.issueTypeId(),
            snapshot.statusId(),
            snapshot.parentId(),
            snapshot.title(),
            snapshot.description(),
            snapshot.priority(),
            snapshot.estimate(),
            snapshot.assigneeIds(),
            snapshot.flagIds(),
            snapshot.tags(),
            snapshot.customFields(),
            relatedTickets,
            snapshot.createdAt(),
            snapshot.changedAt()
        );
    }
}
