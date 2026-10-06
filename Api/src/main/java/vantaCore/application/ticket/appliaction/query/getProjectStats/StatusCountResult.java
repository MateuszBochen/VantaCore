package vantaCore.application.ticket.appliaction.query.getProjectStats;

import java.util.UUID;

public record StatusCountResult(UUID statusId, long count) {
}
