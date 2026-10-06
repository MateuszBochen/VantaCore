package vantaCore.application.board.infrastructure.persistence.repository;

import java.util.UUID;

public interface BoardIdAndNameProjection {

    UUID getId();

    String getName();
}
