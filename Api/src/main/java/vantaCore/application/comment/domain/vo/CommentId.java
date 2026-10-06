package vantaCore.application.comment.domain.vo;

import java.util.UUID;

public record CommentId(UUID value) {

    public static CommentId create() {
        return new CommentId(UUID.randomUUID());
    }

    public CommentId {
        if (value == null) {
            throw new IllegalArgumentException("CommentId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
