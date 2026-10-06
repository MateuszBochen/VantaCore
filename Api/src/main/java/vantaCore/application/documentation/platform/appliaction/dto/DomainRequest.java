package vantaCore.application.documentation.platform.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class DomainRequest {

    @NotNull
    private final UUID id;
    private final String name;
    private final String color;
    private final String description;

    public DomainRequest(UUID id, String name, String color, String description) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.description = description;
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

    public String getDescription() {
        return description;
    }
}
