package vantaCore.application.comment.domain.event;

import vantaCore.application.comment.domain.CommentSnapshot;

public record CommentWasChanged(CommentSnapshot comment) {
}
