package vantaCore.ui.http.rest.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.notification.appliaction.command.upsertNotificationPreference.UpsertNotificationPreferenceCommand;
import vantaCore.application.notification.appliaction.dto.NotificationPreferenceRequest;
import vantaCore.application.notification.appliaction.query.listNotificationPreferences.ListNotificationPreferencesQuery;
import vantaCore.application.notification.appliaction.query.listNotificationPreferences.NotificationPreferenceResult;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

@RestController
@RequestMapping("/api/user/notification-preference")
final public class UserNotificationPreferenceController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    UserNotificationPreferenceController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<NotificationPreferenceResult>> listPreferences() throws Exception {
        Collection<NotificationPreferenceResult> result = this.queryBus.ask(new ListNotificationPreferencesQuery());

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PutMapping
    public OpenApiResponse<Empty> upsertPreference(@RequestBody NotificationPreferenceRequest request) throws Exception {
        this.commandBus.handle(new UpsertNotificationPreferenceCommand(request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
