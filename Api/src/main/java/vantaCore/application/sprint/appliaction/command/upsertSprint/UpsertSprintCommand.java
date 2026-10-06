package vantaCore.application.sprint.appliaction.command.upsertSprint;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.sprint.appliaction.dto.UpsertSprintRequest;

import java.util.UUID;

@RequiresResource(Resource.SPRINT_MANAGE)
final public class UpsertSprintCommand {

    @NotNull
    private final UUID boardId;

    @NotNull
    private final UUID sprintId;

    @Valid
    @NotNull
    private final UpsertSprintRequest upsertSprintRequest;

    public UpsertSprintCommand(UUID boardId, UUID sprintId, UpsertSprintRequest upsertSprintRequest) {
        this.boardId = boardId;
        this.sprintId = sprintId;
        this.upsertSprintRequest = upsertSprintRequest;
    }

    public UUID getBoardId() {
        return boardId;
    }

    public UUID getSprintId() {
        return sprintId;
    }

    public UpsertSprintRequest getUpsertSprintRequest() {
        return upsertSprintRequest;
    }
}
