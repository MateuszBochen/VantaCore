package vantaCore.ui.http.rest.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.user.appliaction.command.assignRoles.AssignRolesToUserCommand;
import vantaCore.application.user.appliaction.command.changePassword.ChangePasswordCommand;
import vantaCore.application.user.appliaction.command.createUser.CreateUserCommand;
import vantaCore.application.user.appliaction.command.updateUser.UpdateUserCommand;
import vantaCore.application.user.appliaction.dto.AssignRolesToUserRequest;
import vantaCore.application.user.appliaction.dto.ChangePasswordRequest;
import vantaCore.application.user.appliaction.dto.CreateUserRequest;
import vantaCore.application.user.appliaction.dto.UpdateUserRequest;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
final public class UserCommandController {

    private final CommandBusInterface commandBus;

    UserCommandController(CommandBusInterface commandBus) {
        this.commandBus = commandBus;
    }

    @PostMapping
    public OpenApiResponse<Empty> createUser(
        @RequestBody CreateUserRequest request
    ) throws Exception {

        this.commandBus.handle(new CreateUserCommand(request));

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }

    // Literal "/me/password" - Spring prefers it over the "/{userId}" patterns regardless of order,
    // and it's two segments anyway, so it can't be read as a userId of "me".
    @PutMapping("/me/password")
    public OpenApiResponse<Empty> changeOwnPassword(@RequestBody ChangePasswordRequest request) throws Exception {
        this.commandBus.handle(new ChangePasswordCommand(request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @PutMapping("/{userId}")
    public OpenApiResponse<Empty> updateUser(
        @PathVariable UUID userId,
        @RequestBody UpdateUserRequest request
    ) throws Exception {

        this.commandBus.handle(new UpdateUserCommand(userId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @PutMapping("/{userId}/roles")
    public OpenApiResponse<Empty> assignRoles(
        @PathVariable UUID userId,
        @RequestBody AssignRolesToUserRequest request
    ) throws Exception {

        this.commandBus.handle(new AssignRolesToUserCommand(userId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
