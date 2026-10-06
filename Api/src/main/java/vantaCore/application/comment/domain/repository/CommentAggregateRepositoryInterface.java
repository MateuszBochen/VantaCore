package vantaCore.application.comment.domain.repository;

import vantaCore.application.comment.domain.CommentAggregate;
import vantaCore.application.comment.domain.vo.CommentId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentAggregateRepositoryInterface {

    void save(CommentAggregate comment);

    Optional<CommentAggregate> findById(CommentId id);

    /** newest first */
    List<CommentAggregate> findAllByTicketId(UUID ticketId);

    void deleteById(CommentId id);
}
