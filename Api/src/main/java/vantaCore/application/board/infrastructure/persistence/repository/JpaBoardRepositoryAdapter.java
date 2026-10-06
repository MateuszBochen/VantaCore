package vantaCore.application.board.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.board.infrastructure.persistence.entity.BoardEntity;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaBoardRepositoryAdapter implements BoardAggregateRepositoryInterface {

    private final SpringDataBoardRepositoryInterface repository;

    public JpaBoardRepositoryAdapter(SpringDataBoardRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(BoardAggregate board) {
        this.repository.save(BoardEntity.fromDomain(board));
    }

    @Override
    public Optional<BoardAggregate> findById(BoardId id) {
        return this.repository.findById(id.value()).map(BoardEntity::toDomain);
    }

    @Override
    public boolean existsById(BoardId id) {
        return this.repository.existsById(id.value());
    }

    @Override
    public List<BoardSummary> findAllSummaries() {
        return this.repository.findAllByOrderByNameAsc().stream()
            .map(projection -> new BoardSummary(new BoardId(projection.getId()), projection.getName()))
            .toList();
    }
}
