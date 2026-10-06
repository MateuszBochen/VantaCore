package vantaCore.application.project.domain.vo;

import java.util.List;
import java.util.UUID;

public record CustomFieldDefinition(
    UUID id,
    String name,
    CustomFieldType type,
    List<String> options,
    boolean multiple
) {
    public CustomFieldDefinition {
        if (id == null) {
            throw new IllegalArgumentException("CustomFieldDefinition id cannot be null");
        }

        options = options == null ? List.of() : List.copyOf(options);
    }
}