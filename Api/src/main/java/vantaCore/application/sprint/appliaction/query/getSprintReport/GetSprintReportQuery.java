package vantaCore.application.sprint.appliaction.query.getSprintReport;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.SPRINT_VIEW)
final public class GetSprintReportQuery {

    @NotNull
    private final UUID boardId;

    @NotNull
    private final UUID sprintId;

    public GetSprintReportQuery(UUID boardId, UUID sprintId) {
        this.boardId = boardId;
        this.sprintId = sprintId;
    }

    public UUID getBoardId() {
        return boardId;
    }

    public UUID getSprintId() {
        return sprintId;
    }
}
