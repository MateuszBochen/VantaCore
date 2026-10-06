package vantaCore.application.board.domain.repository;

import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.vo.BoardId;

import java.util.List;
import java.util.Optional;

public interface BoardAggregateRepositoryInterface {

    /** saving aggregate (create or full replace) */
    void save(BoardAggregate board);

    Optional<BoardAggregate> findById(BoardId id);

    boolean existsById(BoardId id);

    /** lightweight id+name projection of every board */
    List<BoardSummary> findAllSummaries();

    record BoardSummary(BoardId id, String name) {
    }
}
