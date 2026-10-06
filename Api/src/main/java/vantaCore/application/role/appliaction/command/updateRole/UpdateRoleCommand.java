package vantaCore.application.role.appliaction.command.updateRole;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.role.appliaction.dto.RoleRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.ROLE_UPDATE)
final public class UpdateRoleCommand {

    @NotNull
    private final UUID roleId;

    @Valid
    @NotNull
    private final RoleRequest roleRequest;

    public UpdateRoleCommand(UUID roleId, RoleRequest roleRequest) {
        this.roleId = roleId;
        this.roleRequest = roleRequest;
    }

    public UUID getRoleId() {
        return roleId;
    }

    public RoleRequest getRoleRequest() {
        return roleRequest;
    }
}
