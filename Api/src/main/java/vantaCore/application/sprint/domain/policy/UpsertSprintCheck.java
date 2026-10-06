package vantaCore.application.sprint.domain.policy;

import vantaCore.application.board.domain.BoardSnapshot;
import vantaCore.application.sprint.domain.SprintAggregate;

public record UpsertSprintCheck(
    SprintAggregate sprint,
    /** null when creating a brand-new sprint */
    SprintAggregate existing,
    BoardSnapshot board
) {
}
