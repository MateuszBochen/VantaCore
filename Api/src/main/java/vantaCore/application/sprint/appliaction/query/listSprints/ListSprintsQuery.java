package vantaCore.application.sprint.appliaction.query.listSprints;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.LocalDate;
import java.util.UUID;

@RequiresResource(Resource.SPRINT_VIEW)
final public class ListSprintsQuery {

    @NotNull
    private final UUID boardId;

    /** optional inclusive filter on startDate */
    private final LocalDate from;

    /** optional inclusive filter on startDate */
    private final LocalDate till;

    public ListSprintsQuery(UUID boardId, LocalDate from, LocalDate till) {
        this.boardId = boardId;
        this.from = from;
        this.till = till;
    }

    public UUID getBoardId() {
        return boardId;
    }

    public LocalDate getFrom() {
        return from;
    }

    public LocalDate getTill() {
        return till;
    }
}
