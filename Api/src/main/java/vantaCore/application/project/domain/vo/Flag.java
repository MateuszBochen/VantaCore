package vantaCore.application.project.domain.vo;

import java.util.UUID;

public record Flag(
    UUID id,
    String name,
    String color
) {
    public Flag {
        if (id == null) {
            throw new IllegalArgumentException("Flag id cannot be null");
        }
    }
}