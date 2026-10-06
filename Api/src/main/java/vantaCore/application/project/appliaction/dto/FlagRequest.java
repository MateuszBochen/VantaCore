package vantaCore.application.project.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class FlagRequest {

    @NotNull
    private final UUID id;
    private final String name;
    private final String color;

    public FlagRequest(UUID id, String name, String color) {
        this.id = id;
        this.name = name;
        this.color = color;
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
}