package vantaCore.application.project.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class StatusRequest {

    @NotNull
    private final UUID id;
    private final String name;
    private final String color;
    private final boolean isDone;

    public StatusRequest(UUID id, String name, String color, boolean isDone) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isDone = isDone;
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

    public boolean isDone() {
        return isDone;
    }
}
