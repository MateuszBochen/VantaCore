package vantaCore.application.comment.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import vantaCore.application.comment.domain.CommentAggregate;
import vantaCore.application.comment.domain.vo.CommentId;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comments")
public class CommentEntity {

    @Id
    private UUID id;

    private UUID ticketId;
    private UUID authorId;

    @Column(columnDefinition = "text")
    private String body;

    private Instant createdAt;
    private Instant changedAt;

    // Hibernate requires it
    protected CommentEntity() {}

    private CommentEntity(
        UUID id,
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

    public static CommentEntity fromDomain(CommentAggregate comment) {
        var snapshot = comment.toSnapshot();

        return new CommentEntity(
            snapshot.id().value(),
            snapshot.ticketId(),
            snapshot.authorId(),
            snapshot.body(),
            snapshot.createdAt(),
            snapshot.changedAt()
        );
    }

    public CommentAggregate toDomain() {
        return CommentAggregate.newComment(
            new CommentId(this.id),
            this.ticketId,
            this.authorId,
            this.body,
            this.createdAt,
            this.changedAt
        );
    }
}
