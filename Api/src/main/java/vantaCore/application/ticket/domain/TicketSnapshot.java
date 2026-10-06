package vantaCore.application.ticket.domain;

import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketKey;
import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Read-only view of a TicketAggregate's state - the only way anything outside the aggregate gets
 at its fields, since TicketAggregate itself exposes no getters. */
public record TicketSnapshot(
    TicketId id,
    TicketKey key,
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
    Set<TicketRelation> relatedTickets,
    Instant createdAt,
    Instant changedAt,
    Instant doneAt
) {
}
