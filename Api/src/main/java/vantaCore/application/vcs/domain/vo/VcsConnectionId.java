package vantaCore.application.vcs.domain.vo;

import java.util.UUID;

public record VcsConnectionId(UUID value) {
    public VcsConnectionId {
        if (value == null) {
            throw new IllegalArgumentException("VcsConnectionId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
