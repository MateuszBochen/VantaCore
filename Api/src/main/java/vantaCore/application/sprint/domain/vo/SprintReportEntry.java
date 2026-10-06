package vantaCore.application.sprint.domain.vo;

import java.util.UUID;

/** One ticket's state as captured at the moment its sprint was closed - own time spent (minutes),
 not the rolled-up time_spent_all across descendants, since sprint membership is per-ticket, not
 per-hierarchy. */
public record SprintReportEntry(
    UUID ticketId,
    UUID statusId,
    int timeSpent
) {
    public SprintReportEntry {
        if (ticketId == null) {
            throw new IllegalArgumentException("SprintReportEntry ticketId cannot be null");
        }
    }
}
