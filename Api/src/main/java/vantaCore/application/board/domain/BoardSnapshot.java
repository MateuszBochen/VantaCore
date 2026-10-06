package vantaCore.application.board.domain;

import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.board.domain.vo.Column;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Read-only view of a BoardAggregate's state - the only way anything outside the aggregate gets
 at its fields, since BoardAggregate itself exposes no getters. */
public record BoardSnapshot(
    BoardId id,
    String name,
    Set<UUID> projectIds,
    List<Column> columns,
    boolean allowEditTicketInActiveSprint,
    boolean allowChangeEstimateInActiveSprint,
    boolean allowAddTicketToActiveSprint,
    boolean allowRemoveTicketFromActiveSprint
) {
}
