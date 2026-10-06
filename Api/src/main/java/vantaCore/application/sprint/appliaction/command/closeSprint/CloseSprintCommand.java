package vantaCore.application.sprint.appliaction.command.closeSprint;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.SPRINT_CLOSE)
final public class CloseSprintCommand {

    @NotNull
    private final UUID boardId;

    @NotNull
    private final UUID sprintId;

    public CloseSprintCommand(UUID boardId, UUID sprintId) {
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
