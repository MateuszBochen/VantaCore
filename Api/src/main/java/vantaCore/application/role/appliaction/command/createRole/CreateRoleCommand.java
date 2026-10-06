package vantaCore.application.role.appliaction.command.createRole;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.role.appliaction.dto.RoleRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

@RequiresResource(Resource.ROLE_CREATE)
final public class CreateRoleCommand {

    @Valid
    @NotNull
    private final RoleRequest roleRequest;

    public CreateRoleCommand(RoleRequest roleRequest) {
        this.roleRequest = roleRequest;
    }

    public RoleRequest getRoleRequest() {
        return roleRequest;
    }
}
