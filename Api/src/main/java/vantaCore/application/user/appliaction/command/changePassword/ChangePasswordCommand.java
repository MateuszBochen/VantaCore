package vantaCore.application.user.appliaction.command.changePassword;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.user.appliaction.dto.ChangePasswordRequest;

// Self-scoped (always the caller's own account, via CurrentUserProviderInterface) - no
// @RequiresResource, same "not a resource" precedent as avatar upload and user-settings.
final public class ChangePasswordCommand {

    @Valid
    @NotNull
    private final ChangePasswordRequest changePasswordRequest;

    public ChangePasswordCommand(ChangePasswordRequest changePasswordRequest) {
        this.changePasswordRequest = changePasswordRequest;
    }

    public ChangePasswordRequest getChangePasswordRequest() {
        return changePasswordRequest;
    }
}
