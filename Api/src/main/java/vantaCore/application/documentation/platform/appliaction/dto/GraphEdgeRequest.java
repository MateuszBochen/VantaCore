package vantaCore.application.documentation.platform.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class GraphEdgeRequest {

    @NotBlank
    private final String id;

    @NotNull
    private final UUID source;

    @NotNull
    private final UUID target;

    private final String label;

    public GraphEdgeRequest(String id, UUID source, UUID target, String label) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.label = label;
    }

    public String getId() {
        return id;
    }

    public UUID getSource() {
        return source;
    }

    public UUID getTarget() {
        return target;
    }

    public String getLabel() {
        return label;
    }
}
