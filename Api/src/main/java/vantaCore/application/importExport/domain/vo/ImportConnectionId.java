package vantaCore.application.importExport.domain.vo;

import java.util.UUID;

public record ImportConnectionId(UUID value) {
    public ImportConnectionId {
        if (value == null) {
            throw new IllegalArgumentException("ImportConnectionId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
