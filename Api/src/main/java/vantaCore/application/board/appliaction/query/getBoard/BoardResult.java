package vantaCore.application.board.appliaction.query.getBoard;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public record BoardResult(
    UUID id,
    String name,
    Set<UUID> projectIds,
    List<ColumnResult> columns,
    boolean allowEditTicketInActiveSprint,
    boolean allowChangeEstimateInActiveSprint,
    boolean allowAddTicketToActiveSprint,
    boolean allowRemoveTicketFromActiveSprint
) {
}
