package vantaCore.application.sprint.appliaction.query.listSprints;

import java.util.UUID;

public record SprintReportEntryResult(
    UUID ticketId,
    UUID statusId,
    int timeSpent
) {
}
