package vantaCore.application.subProject.appliaction.query.result;

import java.util.UUID;

public record AdrResult(
    UUID id,
    String title,
    String content
) {
}
