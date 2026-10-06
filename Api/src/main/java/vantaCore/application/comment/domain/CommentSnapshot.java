package vantaCore.application.comment.domain;

import vantaCore.application.comment.domain.vo.CommentId;

import java.time.Instant;
import java.util.UUID;

public record CommentSnapshot(
    CommentId id,
    UUID ticketId,
    UUID authorId,
    String body,
    Instant createdAt,
    Instant changedAt
) {
}
