package vantaCore.application.comment.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.comment.infrastructure.persistence.entity.CommentEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataCommentRepositoryInterface extends JpaRepository<CommentEntity, UUID> {

    List<CommentEntity> findAllByTicketIdOrderByCreatedAtDesc(UUID ticketId);
}
