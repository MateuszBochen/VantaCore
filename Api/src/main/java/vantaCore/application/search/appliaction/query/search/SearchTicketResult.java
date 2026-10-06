package vantaCore.application.search.appliaction.query.search;

import java.util.UUID;

public record SearchTicketResult(UUID id, UUID projectId, String key, String title) {
}
