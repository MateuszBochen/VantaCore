package vantaCore.application.subProject.domain.vo;

import java.util.UUID;

public record Adr(
    UUID id,
    String title,
    String content
) {
    public Adr {
        if (id == null) {
            throw new IllegalArgumentException("Adr id cannot be null");
        }
    }
}
