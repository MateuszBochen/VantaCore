package vantaCore.application.subProject.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class AdrRequest {

    @NotNull
    private final UUID id;
    private final String title;
    private final String content;

    public AdrRequest(UUID id, String title, String content) {
        this.id = id;
        this.title = title;
        this.content = content;
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }
}
