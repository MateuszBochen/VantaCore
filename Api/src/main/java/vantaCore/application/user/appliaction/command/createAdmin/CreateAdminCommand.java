package vantaCore.application.user.appliaction.command.createAdmin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.user.appliaction.dto.CreateAdminRequest;

final public class CreateAdminCommand {
    @Valid
    @NotNull
    final private CreateAdminRequest createAdminRequest;
    public CreateAdminCommand(CreateAdminRequest createAdminRequest) {
        this.createAdminRequest = createAdminRequest;
    }

    public CreateAdminRequest getCreateAdminRequest() {
        return createAdminRequest;
    }
}
