package vantaCore.ui.http.rest.controller.notification;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.notification.appliaction.command.markNotificationAsRead.MarkNotificationAsReadCommand;
import vantaCore.application.notification.appliaction.query.listNotifications.ListNotificationsQuery;
import vantaCore.application.notification.appliaction.query.listNotifications.NotificationResult;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.util.UUID;

@RestController
@RequestMapping("/api/notification")
final public class NotificationController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    NotificationController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<NotificationResult>> listNotifications() throws Exception {

        ListNotificationsQuery query = new ListNotificationsQuery();
        Collection<NotificationResult> result = this.queryBus.ask(query);

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PostMapping("/{id}/read")
    public OpenApiResponse<Empty> markAsRead(
        @PathVariable UUID id
    ) throws Exception {

        MarkNotificationAsReadCommand command = new MarkNotificationAsReadCommand(id);
        this.commandBus.handle(command);

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
