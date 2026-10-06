package vantaCore.application.user.appliaction.command.updateUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.user.appliaction.dto.UpdateUserRequest;

import java.util.UUID;

@RequiresResource(Resource.USER_UPDATE)
final public class UpdateUserCommand {

    @NotNull
    private final UUID userId;

    @Valid
    @NotNull
    private final UpdateUserRequest updateUserRequest;

    public UpdateUserCommand(UUID userId, UpdateUserRequest updateUserRequest) {
        this.userId = userId;
        this.updateUserRequest = updateUserRequest;
    }

    public UUID getUserId() {
        return userId;
    }

    public UpdateUserRequest getUpdateUserRequest() {
        return updateUserRequest;
    }
}
