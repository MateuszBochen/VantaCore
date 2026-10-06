package vantaCore.application.search.appliaction.query.search;

import java.util.UUID;

public record SearchTestCaseResult(UUID id, UUID ticketId, UUID projectId, String ticketKey, String title) {
}
