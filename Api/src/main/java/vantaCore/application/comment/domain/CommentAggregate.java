package vantaCore.application.comment.domain;

import vantaCore.application.comment.domain.vo.CommentId;

import java.time.Instant;
import java.util.UUID;

public class CommentAggregate {
    private final CommentId id;
    private final UUID ticketId;
    private final UUID authorId;
    private final String body;
    private final Instant createdAt;
    private final Instant changedAt;

    private CommentAggregate(
        CommentId id,
        UUID ticketId,
        UUID authorId,
        String body,
        Instant createdAt,
        Instant changedAt
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.authorId = authorId;
        this.body = body;
        this.createdAt = createdAt;
        this.changedAt = changedAt;
    }

    /** A brand-new comment - also used to rebuild one from storage, since every field is supplied
     either way. changedAt starts out equal to createdAt (nothing's been edited yet). */
    public static CommentAggregate newComment(
        CommentId id,
        UUID ticketId,
        UUID authorId,
        String body,
        Instant createdAt,
        Instant changedAt
    ) {
        return new CommentAggregate(id, ticketId, authorId, body, createdAt, changedAt);
    }

    /** Corrects the body - id/ticketId/authorId/createdAt are fixed for the comment's lifetime and
     always carry over from the current instance, never from the caller. */
    public CommentAggregate changeBody(String body, Instant changedAt) {
        return new CommentAggregate(this.id, this.ticketId, this.authorId, body, this.createdAt, changedAt);
    }

    public CommentSnapshot toSnapshot() {
        return new CommentSnapshot(id, ticketId, authorId, body, createdAt, changedAt);
    }
}
