package vantaCore.application.board.domain;

import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.board.domain.vo.Column;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public class BoardAggregate {
    private final BoardId id;
    private final String name;
    private final Set<UUID> projectIds;
    // Display order left-to-right on the Kanban board, so a List (not Set) to preserve it.
    private final List<Column> columns;
    private final boolean allowEditTicketInActiveSprint;
    private final boolean allowChangeEstimateInActiveSprint;
    private final boolean allowAddTicketToActiveSprint;
    private final boolean allowRemoveTicketFromActiveSprint;

    private BoardAggregate(
        BoardId id,
        String name,
        Set<UUID> projectIds,
        List<Column> columns,
        boolean allowEditTicketInActiveSprint,
        boolean allowChangeEstimateInActiveSprint,
        boolean allowAddTicketToActiveSprint,
        boolean allowRemoveTicketFromActiveSprint
    ) {
        this.id = id;
        this.name = name;
        this.projectIds = projectIds == null ? Set.of() : Set.copyOf(projectIds);
        this.columns = columns == null ? List.of() : List.copyOf(columns);
        this.allowEditTicketInActiveSprint = allowEditTicketInActiveSprint;
        this.allowChangeEstimateInActiveSprint = allowChangeEstimateInActiveSprint;
        this.allowAddTicketToActiveSprint = allowAddTicketToActiveSprint;
        this.allowRemoveTicketFromActiveSprint = allowRemoveTicketFromActiveSprint;
    }

    /** A brand-new board - also used to rebuild one from storage, since every field is supplied
     either way. */
    public static BoardAggregate newBoard(
        BoardId id,
        String name,
        Set<UUID> projectIds,
        List<Column> columns,
        boolean allowEditTicketInActiveSprint,
        boolean allowChangeEstimateInActiveSprint,
        boolean allowAddTicketToActiveSprint,
        boolean allowRemoveTicketFromActiveSprint
    ) {
        return new BoardAggregate(
            id, name, projectIds, columns,
            allowEditTicketInActiveSprint, allowChangeEstimateInActiveSprint,
            allowAddTicketToActiveSprint, allowRemoveTicketFromActiveSprint
        );
    }

    /** Replaces this board's editable fields - id is fixed for the board's lifetime and always
     carries over from the current instance, never from the caller. */
    public BoardAggregate changeBoard(
        String name,
        Set<UUID> projectIds,
        List<Column> columns,
        boolean allowEditTicketInActiveSprint,
        boolean allowChangeEstimateInActiveSprint,
        boolean allowAddTicketToActiveSprint,
        boolean allowRemoveTicketFromActiveSprint
    ) {
        return new BoardAggregate(
            this.id, name, projectIds, columns,
            allowEditTicketInActiveSprint, allowChangeEstimateInActiveSprint,
            allowAddTicketToActiveSprint, allowRemoveTicketFromActiveSprint
        );
    }

    public BoardSnapshot toSnapshot() {
        return new BoardSnapshot(
            id, name, projectIds, columns,
            allowEditTicketInActiveSprint, allowChangeEstimateInActiveSprint,
            allowAddTicketToActiveSprint, allowRemoveTicketFromActiveSprint
        );
    }
}
