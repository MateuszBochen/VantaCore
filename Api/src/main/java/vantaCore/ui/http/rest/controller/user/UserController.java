package vantaCore.ui.http.rest.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.user.appliaction.command.createAdmin.CreateAdminCommand;
import vantaCore.application.user.appliaction.dto.CreateAdminRequest;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;

@RestController
@RequestMapping("/web-api/user")
final public class UserController {

    private final CommandBusInterface commandBus;

    /** Controller */
    UserController (CommandBusInterface commandBus) {
        this.commandBus = commandBus;
    }

    @PostMapping("/admin")
    public OpenApiResponse<Empty> createAdmin(
        @RequestBody CreateAdminRequest request
    ) throws Exception {

        CreateAdminCommand command = new CreateAdminCommand(request);
        this.commandBus.handle(command);

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }
}
