package vantaCore.application.user.appliaction.command.createUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.user.appliaction.dto.CreateUserRequest;

@RequiresResource(Resource.USER_CREATE)
final public class CreateUserCommand {

    @Valid
    @NotNull
    private final CreateUserRequest createUserRequest;

    public CreateUserCommand(CreateUserRequest createUserRequest) {
        this.createUserRequest = createUserRequest;
    }

    public CreateUserRequest getCreateUserRequest() {
        return createUserRequest;
    }
}
