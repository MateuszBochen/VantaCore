package vantaCore.ui.http.ws;

import vantaCore.application.comment.domain.CommentSnapshot;

import java.time.Instant;
import java.util.UUID;

/** Wire shape pushed over WebSocket for comment add/change events. */
record CommentBroadcastResult(
    UUID id,
    UUID ticketId,
    String body,
    Instant createdAt,
    Instant changedAt,
    UUID authorId
) {
    static CommentBroadcastResult from(CommentSnapshot snapshot) {
        return new CommentBroadcastResult(
            snapshot.id().value(),
            snapshot.ticketId(),
            snapshot.body(),
            snapshot.createdAt(),
            snapshot.changedAt(),
            snapshot.authorId()
        );
    }
}
