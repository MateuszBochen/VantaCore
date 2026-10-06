package vantaCore.application.file.domain.vo;

import java.util.UUID;

public record FileId(UUID value) {

    public FileId {
        if (value == null) {
            throw new IllegalArgumentException("FileId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
