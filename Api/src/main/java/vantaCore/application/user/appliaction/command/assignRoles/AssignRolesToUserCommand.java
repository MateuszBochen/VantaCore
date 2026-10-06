package vantaCore.application.user.appliaction.command.assignRoles;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.user.appliaction.dto.AssignRolesToUserRequest;

import java.util.UUID;

@RequiresResource(Resource.USER_ASSIGN_ROLES)
final public class AssignRolesToUserCommand {

    @NotNull
    private final UUID userId;

    @Valid
    @NotNull
    private final AssignRolesToUserRequest assignRolesToUserRequest;

    public AssignRolesToUserCommand(UUID userId, AssignRolesToUserRequest assignRolesToUserRequest) {
        this.userId = userId;
        this.assignRolesToUserRequest = assignRolesToUserRequest;
    }

    public UUID getUserId() {
        return userId;
    }

    public AssignRolesToUserRequest getAssignRolesToUserRequest() {
        return assignRolesToUserRequest;
    }
}
