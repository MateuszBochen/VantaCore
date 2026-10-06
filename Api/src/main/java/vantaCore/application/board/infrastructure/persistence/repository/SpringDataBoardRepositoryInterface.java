package vantaCore.application.board.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.board.infrastructure.persistence.entity.BoardEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataBoardRepositoryInterface extends JpaRepository<BoardEntity, UUID> {

    List<BoardIdAndNameProjection> findAllByOrderByNameAsc();
}
