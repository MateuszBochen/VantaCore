package vantaCore.application.project.domain.vo;

import java.util.UUID;

public record ProjectId(UUID value) {

    public ProjectId {
        if (value == null) {
            throw new IllegalArgumentException("ProjectId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
