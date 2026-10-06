package vantaCore.application.ticket.appliaction.query.getProjectStats;

import java.util.UUID;

public record IssueTypeCountResult(UUID issueTypeId, long count) {
}
