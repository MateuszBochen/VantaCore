package vantaCore.application.board.domain.vo;

import java.util.Set;
import java.util.UUID;

public record Column(
    UUID id,
    String name,
    String color,
    Set<UUID> statusIds
) {
    public Column {
        if (id == null) {
            throw new IllegalArgumentException("Column id cannot be null");
        }

        statusIds = statusIds == null ? Set.of() : Set.copyOf(statusIds);
    }
}
