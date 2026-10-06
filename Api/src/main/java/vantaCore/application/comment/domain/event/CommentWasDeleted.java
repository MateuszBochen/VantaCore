package vantaCore.application.comment.domain.event;

import java.util.UUID;

public record CommentWasDeleted(UUID ticketId, UUID commentId) {
}
