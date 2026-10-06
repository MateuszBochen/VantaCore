package vantaCore.ui.http.rest.controller.role;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.role.appliaction.command.createRole.CreateRoleCommand;
import vantaCore.application.role.appliaction.command.deleteRole.DeleteRoleCommand;
import vantaCore.application.role.appliaction.command.updateRole.UpdateRoleCommand;
import vantaCore.application.role.appliaction.dto.RoleRequest;
import vantaCore.application.role.appliaction.query.listResources.ListResourcesQuery;
import vantaCore.application.role.appliaction.query.listResources.ResourceResult;
import vantaCore.application.role.appliaction.query.listRoles.ListRolesQuery;
import vantaCore.application.role.appliaction.query.listRoles.RoleSummaryResult;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.util.UUID;

@RestController
@RequestMapping("/api/role")
final public class RoleController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    RoleController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PostMapping
    public OpenApiResponse<Empty> createRole(
        @RequestBody RoleRequest request
    ) throws Exception {

        this.commandBus.handle(new CreateRoleCommand(request));

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }

    @PutMapping("/{roleId}")
    public OpenApiResponse<Empty> updateRole(
        @PathVariable UUID roleId,
        @RequestBody RoleRequest request
    ) throws Exception {

        this.commandBus.handle(new UpdateRoleCommand(roleId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @DeleteMapping("/{roleId}")
    public OpenApiResponse<Empty> deleteRole(
        @PathVariable UUID roleId
    ) throws Exception {

        this.commandBus.handle(new DeleteRoleCommand(roleId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Many<RoleSummaryResult>> listRoles() throws Exception {

        Collection<RoleSummaryResult> result = this.queryBus.ask(new ListRolesQuery());

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @GetMapping("/resource")
    public OpenApiResponse<Many<ResourceResult>> listResources() throws Exception {

        Collection<ResourceResult> result = this.queryBus.ask(new ListResourcesQuery());

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
