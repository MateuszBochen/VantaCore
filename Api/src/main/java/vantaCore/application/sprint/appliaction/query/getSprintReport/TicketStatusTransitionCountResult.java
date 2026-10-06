package vantaCore.application.sprint.appliaction.query.getSprintReport;

import java.util.UUID;

public record TicketStatusTransitionCountResult(UUID ticketId, int count) {
}
