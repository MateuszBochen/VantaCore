package vantaCore.application.sprint.appliaction.command.updateSprintTicket;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.sprint.appliaction.dto.UpdateSprintTicketRequest;

import java.util.UUID;

@RequiresResource(Resource.SPRINT_MANAGE)
final public class UpdateSprintTicketCommand {

    @NotNull
    private final UUID boardId;

    @NotNull
    private final UUID sprintId;

    @Valid
    @NotNull
    private final UpdateSprintTicketRequest updateSprintTicketRequest;

    public UpdateSprintTicketCommand(UUID boardId, UUID sprintId, UpdateSprintTicketRequest updateSprintTicketRequest) {
        this.boardId = boardId;
        this.sprintId = sprintId;
        this.updateSprintTicketRequest = updateSprintTicketRequest;
    }

    public UUID getBoardId() {
        return boardId;
    }

    public UUID getSprintId() {
        return sprintId;
    }

    public UpdateSprintTicketRequest getUpdateSprintTicketRequest() {
        return updateSprintTicketRequest;
    }
}
