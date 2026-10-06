package vantaCore.application.subProject.domain.vo;

import java.util.UUID;

public record SubProjectId(UUID value) {

    public SubProjectId {
        if (value == null) {
            throw new IllegalArgumentException("SubProjectId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
