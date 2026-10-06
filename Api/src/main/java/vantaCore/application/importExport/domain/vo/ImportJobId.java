package vantaCore.application.importExport.domain.vo;

import java.util.UUID;

public record ImportJobId(UUID value) {
    public ImportJobId {
        if (value == null) {
            throw new IllegalArgumentException("ImportJobId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
