package vantaCore.application.release.domain.vo;

import java.util.UUID;

public record ReleaseId(UUID value) {

    public ReleaseId {
        if (value == null) {
            throw new IllegalArgumentException("ReleaseId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
