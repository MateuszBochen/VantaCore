package vantaCore.application.sprint.domain.vo;

import java.util.UUID;

public record SprintId(UUID value) {

    public SprintId {
        if (value == null) {
            throw new IllegalArgumentException("SprintId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
