package vantaCore.application.ticket.domain;

import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketKey;
import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class TicketAggregate {
    private final TicketId id;
    private final TicketKey key;
    private final UUID authorId;
    private final UUID projectId;
    private final UUID subProjectId;
    private final UUID issueTypeId;
    private final UUID statusId;
    private final UUID parentId;
    private final String title;
    private final String description;
    private final Integer priority;
    // Unit-agnostic (SP, man-days, hours, ...) - just a number, no unit tracked. Defaults to 0.
    private final double estimate;
    private final Set<UUID> assigneeIds;
    private final Set<UUID> flagIds;
    private final Set<String> tags;
    private final Map<String, Object> customFields;
    private final Set<TicketRelation> relatedTickets;
    private final Instant createdAt;
    private final Instant changedAt;
    // When the ticket last entered a done status, null while it's not done - see resolveDoneAt.
    private final Instant doneAt;

    private TicketAggregate(
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
        this.id = id;
        this.key = key;
        this.authorId = authorId;
        this.projectId = projectId;
        this.subProjectId = subProjectId;
        this.issueTypeId = issueTypeId;
        this.statusId = statusId;
        this.parentId = parentId;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.estimate = estimate;
        this.assigneeIds = assigneeIds == null ? Set.of() : Set.copyOf(assigneeIds);
        this.flagIds = flagIds == null ? Set.of() : Set.copyOf(flagIds);
        this.tags = tags == null ? Set.of() : Set.copyOf(tags);
        this.customFields = customFields == null ? Map.of() : Map.copyOf(customFields);
        this.relatedTickets = relatedTickets == null ? Set.of() : Set.copyOf(relatedTickets);
        this.createdAt = createdAt;
        this.changedAt = changedAt;
        this.doneAt = doneAt;
    }

    /** A brand-new ticket - also used to rebuild one from storage, since id/key/authorId/createdAt/
     changedAt/doneAt are supplied either way. createdAt == changedAt at creation. A NEW ticket should
     pass doneAt null and then go through withStatus, so a ticket created straight into a done status
     gets its doneAt from the same rule as every later status change. */
    public static TicketAggregate newTicket(
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
        return new TicketAggregate(
            id, key, authorId, projectId, subProjectId, issueTypeId, statusId, parentId,
            title, description, priority, estimate, assigneeIds, flagIds, tags, customFields, relatedTickets,
            createdAt, changedAt, doneAt
        );
    }

    /** Replaces this ticket's editable fields - id/key/authorId/projectId/createdAt are fixed for the
     ticket's lifetime and always carry over from the current instance, never from the caller.
     changedAt is supplied fresh by the caller on every edit. statusIsDone says whether statusId is a
     done status in the owning project (ProjectAggregate.isStatusDone) - the aggregate can't look that
     up itself - and drives doneAt, see resolveDoneAt. */
    public TicketAggregate changeTicket(
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
        boolean statusIsDone,
        Instant changedAt
    ) {
        return new TicketAggregate(
            this.id, this.key, this.authorId, this.projectId, subProjectId, issueTypeId, statusId, parentId,
            title, description, priority, estimate, assigneeIds, flagIds, tags, customFields, relatedTickets,
            this.createdAt, changedAt, resolveDoneAt(statusIsDone, changedAt)
        );
    }

    /** Moves only the status, every other field carrying over - for status changes that aren't a
     user's full edit (e.g. PropagateAutomationCommandHandler's cascades). Same doneAt rule as
     changeTicket, so no status-changing path can forget it. */
    public TicketAggregate withStatus(UUID statusId, boolean statusIsDone, Instant changedAt) {
        return new TicketAggregate(
            this.id, this.key, this.authorId, this.projectId, this.subProjectId, this.issueTypeId,
            statusId, this.parentId, this.title, this.description, this.priority, this.estimate,
            this.assigneeIds, this.flagIds, this.tags, this.customFields, this.relatedTickets,
            this.createdAt, changedAt, resolveDoneAt(statusIsDone, changedAt)
        );
    }

    /** Replaces only this ticket's related-ticket links, every other field carrying over unchanged -
     used to write the inverse side of a relation onto the OTHER ticket when this ticket's own PUT
     adds/removes/retypes a relation (see UpsertTicketCommandHandler.syncInverseRelations). Unlike
     changeTicket, doesn't touch changedAt - this is a side effect of someone else's edit, not an
     edit of this ticket itself. */
    public TicketAggregate withRelatedTickets(Set<TicketRelation> relatedTickets) {
        return new TicketAggregate(
            this.id, this.key, this.authorId, this.projectId, this.subProjectId, this.issueTypeId,
            this.statusId, this.parentId, this.title, this.description, this.priority, this.estimate,
            this.assigneeIds, this.flagIds, this.tags, this.customFields, relatedTickets,
            this.createdAt, this.changedAt, this.doneAt
        );
    }

    /** not done -> done: now. done -> done (even a different done status): unchanged, so the
     original completion time survives. -> not done (reopen): cleared. */
    private Instant resolveDoneAt(boolean statusIsDone, Instant now) {
        if (!statusIsDone) {
            return null;
        }
        return this.doneAt != null ? this.doneAt : now;
    }

    public TicketSnapshot toSnapshot() {
        return new TicketSnapshot(
            id, key, authorId, projectId, subProjectId, issueTypeId, statusId, parentId,
            title, description, priority, estimate, assigneeIds, flagIds, tags, customFields, relatedTickets,
            createdAt, changedAt, doneAt
        );
    }
}
