package vantaCore.application.ticket.domain.history;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** What the ticket's own editable fields looked like at the moment of a save - id/key/authorId/
 projectId are excluded (fixed for the ticket's whole lifetime, no point repeating them per entry),
 and so are the derived rollups (timeSpent/timeSpentAll/estimateAll) since those change independently
 of ticket edits and aren't "what this save set the ticket to".

 @JsonIgnoreProperties: this is deserialized straight out of a jsonb blob (TicketHistoryEntryEntity),
 so an existing entry written before relatedTickets replaced relatedTicketIds still has the old
 field under its old name - ignored rather than failing to load, with relatedTickets simply absent
 (null) on that old entry rather than a 500 when someone views old history. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TicketHistorySnapshot(
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
    Set<TicketRelation> relatedTickets
) {
}
