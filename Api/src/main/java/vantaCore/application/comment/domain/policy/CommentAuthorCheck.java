package vantaCore.application.comment.domain.policy;

import vantaCore.application.comment.domain.CommentSnapshot;

import java.util.UUID;

public record CommentAuthorCheck(CommentSnapshot comment, UUID currentUserId) {
}
