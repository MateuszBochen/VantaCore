package vantaCore.application.project.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

final public class CustomFieldDefinitionRequest {

    @NotNull
    private final UUID id;
    private final String name;
    private final String type;
    private final List<String> options;
    private final boolean multiple;

    public CustomFieldDefinitionRequest(UUID id, String name, String type, List<String> options, boolean multiple) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.options = options;
        this.multiple = multiple;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public List<String> getOptions() {
        return options;
    }

    public boolean isMultiple() {
        return multiple;
    }
}