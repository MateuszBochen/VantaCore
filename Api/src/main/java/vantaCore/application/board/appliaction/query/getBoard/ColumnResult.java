package vantaCore.application.board.appliaction.query.getBoard;

import java.util.Set;
import java.util.UUID;

public record ColumnResult(
    UUID id,
    String name,
    String color,
    Set<UUID> statusIds
) {
}
