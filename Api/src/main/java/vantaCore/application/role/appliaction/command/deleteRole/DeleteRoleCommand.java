package vantaCore.application.role.appliaction.command.deleteRole;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.ROLE_DELETE)
final public class DeleteRoleCommand {

    @NotNull
    private final UUID roleId;

    public DeleteRoleCommand(UUID roleId) {
        this.roleId = roleId;
    }

    public UUID getRoleId() {
        return roleId;
    }
}
