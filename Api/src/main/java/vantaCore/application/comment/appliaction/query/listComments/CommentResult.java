package vantaCore.application.comment.appliaction.query.listComments;

import java.time.Instant;
import java.util.UUID;

public record CommentResult(
    // Not in the example payload you gave, but needed to address PUT/DELETE .../comment/{commentId} -
    // added deliberately, same reasoning as WorklogResult.id.
    UUID id,
    String body,
    Instant createdAt,
    Instant changedAt,
    CommentActorResult actor
) {
}
