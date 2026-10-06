package vantaCore.application.board.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

final public class ColumnRequest {

    @NotNull
    private final UUID id;
    private final String name;
    private final String color;
    private final List<UUID> statusIds;

    public ColumnRequest(UUID id, String name, String color, List<UUID> statusIds) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.statusIds = statusIds;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getColor() {
        return color;
    }

    public List<UUID> getStatusIds() {
        return statusIds;
    }
}
