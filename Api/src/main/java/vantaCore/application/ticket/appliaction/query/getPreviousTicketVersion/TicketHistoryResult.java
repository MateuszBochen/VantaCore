package vantaCore.application.ticket.appliaction.query.getPreviousTicketVersion;

import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public record TicketHistoryResult(
    UUID id,
    UUID ticketId,
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
    Set<TicketRelation> relatedTickets,
    UUID changedByUserId,
    String changedByEmail,
    Instant changedAt
) {
}
