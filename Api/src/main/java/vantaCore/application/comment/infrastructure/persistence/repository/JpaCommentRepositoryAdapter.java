package vantaCore.application.comment.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.comment.domain.CommentAggregate;
import vantaCore.application.comment.domain.repository.CommentAggregateRepositoryInterface;
import vantaCore.application.comment.domain.vo.CommentId;
import vantaCore.application.comment.infrastructure.persistence.entity.CommentEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaCommentRepositoryAdapter implements CommentAggregateRepositoryInterface {

    private final SpringDataCommentRepositoryInterface repository;

    public JpaCommentRepositoryAdapter(SpringDataCommentRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(CommentAggregate comment) {
        this.repository.save(CommentEntity.fromDomain(comment));
    }

    @Override
    public Optional<CommentAggregate> findById(CommentId id) {
        return this.repository.findById(id.value()).map(CommentEntity::toDomain);
    }

    @Override
    public List<CommentAggregate> findAllByTicketId(UUID ticketId) {
        return this.repository.findAllByTicketIdOrderByCreatedAtDesc(ticketId).stream()
            .map(CommentEntity::toDomain)
            .toList();
    }

    @Override
    public void deleteById(CommentId id) {
        this.repository.deleteById(id.value());
    }
}
